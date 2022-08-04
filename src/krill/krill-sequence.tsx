/**
 * penguins-eggs: krill_sequence
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

/**
 * Note: I'm using REACT here to get a TUI, 
 *       via ink library https://github.com/vadimdemedes/ink
 */


/**
 * Ideally, I want to respect calamares way, remplementing the same (SEMPLIFIED) steps for CLI
 * 
 * Phase 2 - install.
 * 
 *  - partition:     partitions
 *  - mount:         mountFs, mountVfs
 *  - unpackfs:      unpackfs 
 *  - _restore:      eggs syncfrom --rootdir /tmp/calamares-krill-root/
 *  - sources-yolk:  execCalamaresModule('sources-yolk')
 *  - machineid:     machineid
 *  - fstab:         fstab
 *  - locale         locale
 *  - keyboard:      keyboard
 *  - localecfg:     localecfg
 *  - users:         users
 *  - displaymanager: autologin
 *  - networkcfg:    networkcfg
 *  - hwclock:
 *  - services-systemd:
 *  - bootloader-config: execCalamaresModule('bootloader-config')
 *  - grubcfg:       grubcfg
 *  - bootloader:    bootloaded
 *  - packages:      removeInstaller
 *  - luksbootkeyfile:
 *  - plymouthcfg;
 *  - initramfscfg:  initramfscfg
 *  - initramfs:     initramfs
 *  - removeuser:    removeuser
 *  - sources-yolk-unmount: execCalamaresModule('sources-yolk-unmount')
 *  - umount:     umountVfs, this.umountFs
 */


import { IRemix, IDistro, INet } from '../interfaces'
import Settings from '../classes/settings'

import React from 'react';
import { render, RenderOptions } from 'ink'
import Install from '../components/install'
import Finished from '../components/finished'

import fs from 'fs'
import yaml from 'js-yaml'
import shx from 'shelljs'
import Utils from '../classes/utils'
import cliAutologin = require('../lib/cli-autologin')
import Pacman from '../classes/pacman';
import { installer } from '../classes/incubation/installer'
import Xdg from '../classes/xdg';
import Distro from '../classes/distro'

import { IInstaller, IDevices, IDevice } from '../interfaces'
import { ICalamaresModule, ILocation, IKeyboard, IPartitions, IUsers } from '../interfaces/i-krill'
import { exec } from '../lib/utils'

// import krill modules
import partition from './modules/partitions'
import {mountFs, umountFs} from './modules/mount-fs'
import {mountVfs, umountVfs} from './modules/mount-vfs'
import unpackfs from './modules/unpackfs'
import machineId from './modules/machine-id'
import fstab from './modules/fstab'
import locale from './modules/locale'
import setKeyboard from './modules/set-keyboard'
import localeCfg from './modules/locale-cfg'
// users
import addUser from './modules/add-user'
import changePassword from './modules/change-password'
// displaymanager: autologin
import networkCfg from './modules/network-cfg'
// hwclock:
// services-systemd:
// bootloader-config
import bootloaderConfig from './modules/bootloader-config'
import bootloaderConfigArch from './modules/bootloader-config-arch'
import bootloaderConfigUbuntu from './modules/bootloader-config-ubuntu'
//
import grubcfg from './modules/grubcfg'
import bootloader from './modules/bootloader'
// packages: removeInstallerLink
import removeInstallerLink from './modules/remove-installer-link'
// luksbootkeyfile:
// plymouthcfg;
import initramfsCfg from './modules/initramfs-cfg'
import initramfs from './modules/initramfs'
import delLiveUser from './modules/del-live-user'
// umount already imported

// to order in same wat
import setTimezone from './modules/set-timezone'
import umount from './modules/umount'
import mkfs from './modules/mkfs'
import hostname from './modules/hostname'
import hosts from './modules/hosts'

/**
 * hatching: installazione o cova!!!
 */
export default class Sequence {
   public partition = partition
   // mount
   public mountFs = mountFs
   public mountVfs = mountVfs
   //
   public unpackfs = unpackfs
   public machineId = machineId
   public fstab = fstab
   public locale = locale
   public setKeyboard = setKeyboard
   public localeCfg = localeCfg
   // users
   public addUser = addUser
   public changePassword = changePassword
   // displaumanager: autologin
   public networkCfg = networkCfg 
   // hwclock:
   // services-systemd:
   // bootloader-config
   public bootloaderConfig = bootloaderConfig
   public bootloaderConfigArch = bootloaderConfigArch
   public bootloaderConfigUbuntu = bootloaderConfigUbuntu
   // 
   public grubcfg = grubcfg
   public bootloader = bootloader
   // packages: removeInstallerLink
   public removeInstallerLink = removeInstallerLink
   // luksbootkeyfile:
   // plymouthcfg;
   public initramfsCfg = initramfsCfg
   public initramfs = initramfs
   public delLiveUser = delLiveUser
   public umountFs = umountFs
   public umountVfs = umountVfs
   // to order in same wat
   public setTimezone = setTimezone
   public umount = umount
   public mkfs = mkfs
   public hostname = hostname
   public hosts = hosts
   

   installer = {} as IInstaller

   installTarget = '/tmp/calamares-krill-root'

   verbose = false

   echo = {}

   efi = false

   devices = {} as IDevices

   users = {} as IUsers

   network = {} as INet

   partitions = {} as IPartitions

   language = ''

   region = ''

   zone = ''

   keyboardModel = ''

   keyboardLayout = ''

   keyboardVariant = ''

   toNull = ' > /dev/null 2>&1'

   settings = {} as Settings

   remix = {} as IRemix

   distro = {} as IDistro

   luksName = ''

   luksFile = ''

   luksDevice = ''

   luksMountpoint = ''

   personalFile= ''


   /**
    * constructor
    */
   constructor(location: ILocation, keyboard: IKeyboard, partitions: IPartitions, users: IUsers, network: INet) {

      this.installer = installer()
      this.settings = new Settings()

      this.language = location.language
      this.region = location.region
      this.zone = location.zone

      this.keyboardModel = keyboard.keyboardModel
      this.keyboardLayout = keyboard.keyboardLayout
      this.keyboardVariant = keyboard.keyboardVariant

      this.network = network

      this.partitions = partitions

      this.users = users

      this.devices.efi = {} as IDevice
      this.devices.boot = {} as IDevice
      this.devices.root = {} as IDevice
      this.devices.data = {} as IDevice
      this.devices.swap = {} as IDevice

      this.distro = new Distro(this.remix)

      this.efi = fs.existsSync('/sys/firmware/efi/efivars')

      // Per il restore dei dati
      this.luksName = 'luks-eggs-backup'
      this.luksFile = `/run/live/medium/live/${this.luksName}`
      this.luksDevice = `/dev/mapper/${this.luksName}`
      this.luksMountpoint = `/mnt`

      // per il restore dei dati personali controllo esistenza di personal.md
      this.personalFile = `/run/live/medium/live/personal.md`
   }

   /**
    * install
    * @param verbose 
    * @param umount 
    * @returns 
    */
   async install(verbose = false) {
      this.verbose = verbose
      this.echo = Utils.setEcho(this.verbose)
      if (this.verbose) {
         this.toNull = ''
      }


      // start
      await this.settings.load()

      // partition
      let percent = 0.0
      let message = ""
      let isPartitioned = false

      message = "Creating partitions"
      percent = 0.01
      try {
         await redraw(<Install message={message} percent={percent} />)
         isPartitioned = await this.partition()
      } catch (error) {
         await Utils.pressKeyToExit(JSON.stringify(error))
      }

      if (isPartitioned) {

         // formatting
         message = "Formatting file system "
         percent = 0.02
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.mkfs()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // mountFs
         message = "Mounting target file system "
         percent = 0.03
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.mountFs()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // mountVfs
         message = "Mounting on target VFS "
         percent = 0.06
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.mountVfs()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // unpackfs
         message = "Unpacking filesystem "
         percent = 0.10
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.unpackfs()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         /**
          * IF RESTORE USERS DATA
          */
         if (fs.existsSync(this.luksFile)) {

            // restoring users data
            message = "Restore private data from backup "
            percent = 0.37
            let cmd = 'eggs syncfrom --rootdir /tmp/calamares-krill-root/'
            try {
               await redraw(<Install message={message} percent={percent} spinner={true} />)
               await exec(cmd, Utils.setEcho(true))
            } catch (error) {
               await Utils.pressKeyToExit(cmd)
            }
         }

         // sources-yolk
         if (this.distro.familyId === 'debian') {
            message = 'sources-yolk'
            percent = 0.40
            try {
               await redraw(<Install message={message} percent={percent} spinner={true} />)
               await this.execCalamaresModule('sources-yolk')
            } catch (error) {
               await Utils.pressKeyToExit(JSON.stringify(error))
            }
         }

         // machineid
         message = 'machineid'
         percent = 0.41
         try {
            await redraw(<Install message={message} percent={percent} spinner={true} />)
            await this.machineId()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // fstab
         message = "Creating fstab "
         percent = 0.47
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.fstab(this.partitions.installationDevice)
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // locale
         message = "Locale "
         percent = 0.47
         try {
            redraw(<Install message={message} percent={percent} />)
            await this.locale()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // keyboard
         message = "settings keyboard "
         percent = 0.48
         try {
            this.setKeyboard()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // localeCfg
         message = "localeCfg"
         percent = 0.50
         try {
            this.localeCfg()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }


         // networkcfg
         message = "networkcfg"
         percent = 0.50
         try {
            this.networkCfg()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // hostname
         message = "Create hostname "
         percent = 0.53
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.hostname()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // hosts
         message = "Creating hosts "
         percent = 0.60
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.hosts()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // bootloader-config
         message = "bootloader-config "
         percent = 0.62
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.bootloaderConfig()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // grubcfg
         message = "grubcfg "
         percent = 0.63
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.grubcfg()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // bootloader
         message = "bootloader "
         percent = 0.64
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.bootloader()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // initramfsCfg
         message = "initramfs configure"
         percent = 0.65
         try {
            await redraw(<Install message={message} percent={percent} />)
            this.initramfsCfg(this.partitions.installationDevice)
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // initramfs
         message = "initramfs "
         percent = 0.67
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.initramfs()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }


         /**
          * IF NOT RESTORE USERS DATA OR PERSONAL BACKUP
          */
         if (!fs.existsSync(this.luksFile) || fs.existsSync(this.personalFile) ) {
            // delLiveUser
            message = "Removing user live "
            percent = 0.70
            try {
               await redraw(<Install message={message} percent={percent} />)
               await this.delLiveUser()
            } catch (error) {
               await Utils.pressKeyToExit(JSON.stringify(error))
            }

            // addUser
            message = "Adding user "
            percent = 0.73
            try {
               await redraw(<Install message={message} percent={percent} />)
               await this.addUser(this.users.name, this.users.password, this.users.fullname, '', '', '')
            } catch (error) {
               await Utils.pressKeyToExit(JSON.stringify(error))
            }

            // changePassword
            message = "adding user password "
            percent = 0.77
            try {
               await redraw(<Install message={message} percent={percent} />)
               await this.changePassword('root', this.users.rootPassword)
            } catch (error) {
               await Utils.pressKeyToExit(JSON.stringify(error))
            }
         }

         // autologin
         if (Pacman.isInstalledGui()) {
            try {
               message = "autologin GUI"
               percent = 0.80
               await Xdg.autologin(Utils.getPrimaryUser(), this.users.name, this.installTarget)
               await redraw(<Install message={message} percent={percent} />)
            } catch (error) {
               await Utils.pressKeyToExit(JSON.stringify(error))
            }
         } else { // autologin CLI remove DEFAULT
            message = "autologin CLI"
            percent = 0.80
            try {
               await redraw(<Install message={message} percent={percent} />)
               await cliAutologin.remove(this.installTarget)
            } catch (error) {
               await Utils.pressKeyToExit(JSON.stringify(error))
            }
         }

         // cleanup
         await cliAutologin.msgRemove(`${this.installTarget}/etc/motd`)
         await cliAutologin.msgRemove(`${this.installTarget}/etc/issue`)

         // removeInstaller
         message = "remove installer"
         percent = 0.87
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.removeInstallerLink()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // sourcesYolkUmount
         if (this.distro.familyId === 'debian') {
            message = "sources yolk unmount"
            percent = 0.92
            try {
               await redraw(<Install message={message} percent={percent} />)
               await this.execCalamaresModule('sources-yolk-unmount')
            } catch (error) {
               await Utils.pressKeyToExit(JSON.stringify(error))
            }
         }

         // umountVfs
         message = "umount VFS"
         percent = 0.95
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.umountVfs()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // umount
         message = "umount"
         percent = 0.97
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.umountFs()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }

         // finished
         message = "finished"
         percent = 100.0
         try {
            await redraw(<Install message={message} percent={percent} />)
            await this.finished()
         } catch (error) {
            await Utils.pressKeyToExit(JSON.stringify(error))
         }
      }
   }



   /**
    * 
    */
   async execCalamaresModule(name: string) {
      const moduleName = this.installer.multiarchModules + name + '/module.desc'
      if (fs.existsSync(moduleName)) {
         const calamaresModule = yaml.load(fs.readFileSync(moduleName, 'utf8')) as ICalamaresModule
         let command = calamaresModule.command
         if (command !== '' || command !== undefined) {
            command += this.toNull
            await exec(command, this.echo)
         }
      }
   }

   /**
    * only show the result
    */
   async finished() {
      await redraw(<Finished installationDevice={this.partitions.installationDevice} hostName={this.users.hostname} userName={this.users.name} />)
      Utils.pressKeyToExit('Press a key to reboot...')
      shx.exec('reboot')
   }
}

// const ifaces: string[] = fs.readdirSync('/sys/class/net/')

/**
 * 
 * @param elem 
 */
 async function redraw(elem: JSX.Element) {
   let opt: RenderOptions = {}

   opt.patchConsole = false
   opt.debug = false
   console.clear()
   // await exec('clear', Utils.setEcho(false))
   render(elem, opt)
}

