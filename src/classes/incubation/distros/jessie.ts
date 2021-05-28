/**
 * penguins-eggs: jessie.ts
 * 
 * it work both: jessie
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import fs = require('fs')
import shx = require('shelljs')
import yaml = require('js-yaml')
import path = require('path')

import { IRemix, IDistro } from '../../../interfaces'

import Pacman from '../../pacman'
import Fisherman from '../fisherman'

const exec = require('../../../lib/utils').exec

/**
 *
 */
export class Jessie {
   verbose = false

   installer = {} as IInstaller

   remix: IRemix

   distro: IDistro

   release = false

   user_opt: string

   // per jessie e stretch rootTemplate è SEMPRE eggs
   rootTemplate = './../../../../conf/distros/jessie/eggs/'

   dirCalamaresModules = '/usr/lib/x86_64-linux-gnu/eggs/'

   dirModules = '/etc/penguins-eggs.d/eggs/'

   /**
    * @param remix
    * @param distro
    * @param displaymanager
    * @param verbose
    */
   constructor(installer : IInstaller, remix: IRemix, distro: IDistro, release: boolean, user_opt: string, verbose = false) {
      this.installer = installer
      this.remix = remix
      this.distro = distro
      this.user_opt = user_opt
      this.verbose = verbose
      this.release = release


      /**
       * I template sono quelli di calamares per buster, bullseye, etc
       * 
       * this.rootTemplate = path.resolve(__dirname, './../../../../conf/distros/' + this.distro.versionLike + '/calamares/')
       * 
       * Ma NON per jessie e stretch
       */
      this.rootTemplate = path.resolve(__dirname, './../../../../conf/distros/' + this.distro.versionLike + '/eggs/')
      console.log('rootTemplate=' + this.rootTemplate)
   }


   /**
    *
    */
   async create() {
      const fisherman = new Fisherman(this.distro, this.installer, this.verbose)

      await fisherman.settings(this.remix.branding)

      await fisherman.buildModule('partition', this.remix.branding)
      // await fisherman.buildModule('mount')
      // await fisherman.moduleUnpackfs()
      await fisherman.buildCalamaresModule('sources-yolk', true)
      // await fisherman.buildModule('machineid')
      // await fisherman.buildModule('fstab')
      // await fisherman.buildModule('locale')
      // await fisherman.buildModule('keyboard')
      // await fisherman.buildModule('localecfg')
      // await fisherman.buildModule('users')
      // await fisherman.moduleDisplaymanager()
      // await fisherman.buildModule('networkcfg')
      // await fisherman.buildModule('hwclock')
      // await fisherman.buildModule('services-systemd')
      // await fisherman.buildCalamaresModule('bootloader-config', true)
      // await fisherman.buildModule('grubcfg') // python
      // await fisherman.buildModule('bootloader') // python
      // await fisherman.modulePackages(this.distro, this.release) //
      // await fisherman.buildModule('luksbootkeyfile')
      // await fisherman.buildModule('plymouthcfg')
      // await fisherman.buildModule('initramfscfg')
      // await fisherman.buildModule('initramfs')
      await fisherman.moduleRemoveuser(this.user_opt)
      await fisherman.buildCalamaresModule('sources-yolk-unmount', false)
      // await fisherman.buildModule('umount')
      // await fisherman.buildCalamaresModule('remove-link')
      // await fisherman.moduleFinished()
   }
}
