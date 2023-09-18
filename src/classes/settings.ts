/**
 * penguins-eggs
 * name: settings.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'node:fs'
import os from 'node:os'
import yaml from 'js-yaml'
import shx from 'shelljs'
import chalk from 'chalk'

const pjson = require('../../package.json')

// interfaces
import { IRemix, IDistro, IApp, IWorkDir } from '../interfaces/index'

// classes
import Utils from './utils'
import Incubator from './incubation/incubator'
import Distro from './distro'
import Pacman from './pacman'
import { IEggsConfig } from '../interfaces/index'

const config_file = '/etc/penguins-eggs.d/eggs.yaml' as string

/**
 * Setting
 */
export default class Settings {
  app = {} as IApp

  config = {} as IEggsConfig

  remix = {} as IRemix

  work_dir = {} as IWorkDir

  distro = {} as IDistro

  incubator = {} as Incubator

  i686 = false

  isLive = false

  efi_work = ''

  iso_work = ''

  kernel_image = ''

  initrd_image = ''

  vmlinuz = ''

  initrdImg = ''

  session_excludes = ''

  isoFilename = '' // resulting name of the iso

  constructor(compression = '') {
    this.config.compression = compression

    this.app.author = 'Piero Proietti'
    this.app.homepage = 'https://github.com/pieroproietti/penguins-eggs'
    this.app.mail = 'piero.proietti@gmail.com'
    this.app.name = pjson.name
    this.app.version = pjson.version
    this.isLive = Utils.isLive()
    this.i686 = Utils.isi686()
    this.distro = new Distro(this.remix)
  }

  /**
   *
   * @param config
   */
  async save(config: IEggsConfig) {
    fs.writeFileSync(config_file, yaml.dump(config), 'utf-8')
  }

  /**
   * Load configuration from config_file
   * @returns {boolean} Success
   */
  async load(): Promise<boolean> {
    const foundSettings = true

    if (!fs.existsSync(config_file)) {
      console.log(`cannot find configuration file ${config_file},`)
      console.log('please generate it with: sudo eggs config')
      process.exit(1)
    }

    this.config = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IEggsConfig

    this.session_excludes = ''
    if (!this.config.snapshot_dir.endsWith('/')) {
      this.config.snapshot_dir += '/'
    }

    this.work_dir.ovarium = this.config.snapshot_dir + 'ovarium/'
    this.work_dir.lowerdir = this.work_dir.ovarium + '.overlay/lowerdir'
    this.work_dir.upperdir = this.work_dir.ovarium + '.overlay/upperdir'
    this.work_dir.workdir = this.work_dir.ovarium + '.overlay/workdir'

    this.config.snapshot_mnt = this.config.snapshot_dir + 'mnt/'
    if (!this.config.snapshot_mnt.endsWith('/')) {
      this.config.snapshot_mnt += '/'
    }

    this.work_dir.merged = this.config.snapshot_mnt + 'filesystem.squashfs'
    this.efi_work = this.config.snapshot_mnt + 'efi-work/'
    this.iso_work = this.config.snapshot_mnt + 'iso/'

    // remember: before was hostname, not empty
    if (this.config.snapshot_basename === '') {
      this.config.snapshot_basename = os.hostname()
    }

    if (this.config.make_efi && !Pacman.isUefi()) {
      Utils.error('You choose to create an UEFI image, but miss to install grub-efi-amd64-bin package.')
      Utils.error('Please install it before to create an UEFI image:')
      Utils.warning('sudo apt install grub-efi-amd64-bin')
      Utils.error('or edit /etc/penguins-eggs.d/eggs.yaml and set the valuer of make_efi = false')
      this.config.make_efi = false
    }

    this.kernel_image = this.config.vmlinuz
    this.initrd_image = this.config.initrd_img
    this.vmlinuz = this.kernel_image.slice(this.kernel_image.lastIndexOf('/'))
    this.initrdImg = this.initrd_image.slice(this.initrd_image.lastIndexOf('/'))

    /**
     * Use the login name set in the config file. If not set, use the primary
     * user's name. If the name is not "user" then add boot option. ALso use
     * the same username for cleaning geany history.
     */
    if (
      (this.config.user_opt === undefined || this.config.user_opt === '') && // this.user_opt = shx.exec('awk -F":" \'/1000:1000/ { print $1 }\' /etc/passwd', { silent: true }).stdout.trim()
      this.config.user_opt === ''
    ) {
      this.config.user_opt = 'live'
    }

    if (this.config.user_opt_passwd === '') {
      this.config.user_opt_passwd = 'evolution'
    }

    if (this.config.root_passwd === '') {
      this.config.root_passwd = 'evolution'
    }

    if (this.config.timezone === undefined || this.config.timezone === '') {
      this.config.timezone = shx.exec('cat /etc/timezone', { silent: true }).stdout.trim()
    }

    return foundSettings
  }

  /**
   * Calculate and show free space on the disk
   * @returns {void}
   */
  async listFreeSpace(): Promise<void> {
    if (!fs.existsSync(this.config.snapshot_dir)) {
      fs.mkdirSync(this.config.snapshot_dir)
      if (!fs.existsSync(this.config.snapshot_mnt)) {
        fs.mkdirSync(this.config.snapshot_mnt)
      }
    }

    /** Lo spazio usato da SquashFS non è stimabile da live
     * errore buffer troppo piccolo
     */
    const gb = 1_048_576
    let spaceAvailable = 0
    if (!Utils.isLive()) {
      console.log(`Disk space used: ${Math.round((Utils.getUsedSpace() / gb) * 10) / 10} GB`)
    }

    spaceAvailable = Number(
      shx
        .exec(`df "${this.config.snapshot_mnt}" | /usr/bin/awk 'NR==2 {print $4}'`, {
          silent: true,
        })
        .stdout.trim(),
    )
    console.log(`Space available: ${Math.round((spaceAvailable / gb) * 10) / 10} GB`)
    console.log(`There are ${Utils.getSnapshotCount(this.config.snapshot_mnt)} snapshots taking ${Math.round((Utils.getSnapshotSize(this.config.snapshot_mnt) / gb) * 10) / 10} GB of disk space.`)
    console.log()

    if (spaceAvailable > gb * 3) {
      console.log(chalk.cyanBright('The free space should be sufficient to hold the'))
      console.log(chalk.cyanBright('compressed data from the system'))
    } else {
      console.log(chalk.redBright('The free space should be insufficient') + '.')
      console.log()
      if (Utils.isMountpoint(this.config.snapshot_mnt)) {
        console.log('If necessary, you can create more available space')
        console.log('by removing previous  snapshots and saved copies.')
      } else {
        console.log(`You can mount a free partition under ${this.config.snapshot_mnt}`)
      }
      console.log()
    }
  }

  /**
   *
   * @param basename
   * @param theme
   */
  async loadRemix(basename = '', theme = '') {
    this.remix.versionNumber = Utils.getPackageVersion()
    this.remix.kernel = Utils.kernelVersion()

    this.remix.branding = theme === '' ? 'eggs' : this.remix.branding = theme.slice(Math.max(0, theme.lastIndexOf('/') + 1))

    this.remix.name = this.config.snapshot_basename
    let name = this.config.snapshot_prefix + this.config.snapshot_basename
    name = name.replace(/-/g, ' ').replace('egg of ', '')
    this.remix.fullname = name
    this.remix.versionName = name.toUpperCase()
  }
}
