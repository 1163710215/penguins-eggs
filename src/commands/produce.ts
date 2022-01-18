/* eslint-disable unicorn/no-process-exit */
/* eslint-disable no-process-exit */
/* eslint-disable no-console */
/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import Utils from '../classes/utils'
import Ovary from '../classes/ovary'
import Compressors from '../classes/compressors'
import Config from './config'
import chalk from 'chalk'
import { IMyAddons } from '../interfaces'
import fs from 'node:fs'
import path from 'node:path'
import Settings from '../classes/settings'

export default class Produce extends Command {
  static flags = {
    prefix: Flags.string({ char: 'p', description: 'prefix' }),
    basename: Flags.string({ description: 'basename' }),
    backup: Flags.boolean({ char: 'b', description: 'backup mode' }),
    fast: Flags.boolean({ char: 'f', description: 'fast compression' }),
    normal: Flags.boolean({ char: 'n', description: 'normal compression' }),
    max: Flags.boolean({ char: 'm', description: 'max compression' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
    yolk: Flags.boolean({ char: 'y', description: '-y force yolk renew' }),
    script: Flags.boolean({ char: 's', description: 'script mode. Generate scripts to manage iso build' }),
    help: Flags.help({ char: 'h' }),
    theme: Flags.string({ description: 'theme for livecd, calamares branding and partitions' }),
    addons: Flags.string({ multiple: true, description: 'addons to be used: adapt, ichoice, pve, rsupport' }),
    release: Flags.boolean({ description: 'release: configure GUI installer to remove eggs and calamares after installation' })
  }

  static description = 'the system produce an egg: iso image of your system'

  static aliases = ['spawn', 'lay']

  static examples = [
    '$ sudo eggs produce \nproduce an ISO called [hostname]-[arch]-YYYY-MM-DD_HHMM.iso, compressed xz (standard compression).\nIf hostname=ugo and arch=i386 ugo-x86-2020-08-25_1215.iso\n',
    '$ sudo eggs produce -v\nsame as previuos, but with --verbose output\n',
    '$ sudo eggs produce -vf\nsame as previuos, compression zstd, lz4 or gzip (depend from system capability)\n',
    '$ sudo eggs produce -vm\nsame as previuos, compression xz -Xbcj x86 (max compression, about 10%\nmore compressed)\n',
    '$ sudo eggs produce -vf --basename leo --theme debian --addons adapt \nproduce an ISO called leo-i386-2020-08-25_1215.iso compression fast,\nusing Debian theme and link to adapt\n',
    '$ sudo eggs produce -v --basename leo --theme debian --addons rsupport \nproduce an ISO called leo-i386-2020-08-25_1215.iso compression xz,\nusing Debian theme and link to dwagent\n',
    '$ sudo eggs produce -v --basename leo --rsupport \nproduce an ISO called leo-i386-2020-08-25_1215.iso compression xz, using eggs\ntheme and link to dwagent\n',
    '$ sudo eggs produce -vs --basename leo --rsupport \nproduce scripts to build an ISO as the previus example. Scripts can be found\nin /home/eggs/ovarium and you can customize all you need\n'
  ]

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Produce)
    if (Utils.isRoot(this.id)) {
      /**
       * ADDONS dei vendors
       * Fino a 3
       */
      const addons = []
      if (flags.addons) {
        const addons = flags.addons // array
        for (let addon of addons) {
          // se non viene specificato il vendor il default è eggs
          if (!addon.includes('//')) {
            addon = 'eggs/' + addon
          }

          const dirAddon = path.resolve(__dirname, `../../addons/${addon}`)
          if (!fs.existsSync(dirAddon)) {
            console.log(dirAddon)
            Utils.warning('addon: ' + chalk.white(addon) + ' not found, terminate!')
            process.exit()
          }

          const vendorAddon = addon.slice(0, Math.max(0, addon.search('/')))
          const nameAddon = addon.substring(addon.search('/') + 1, addon.length)
          if (nameAddon === 'theme') {
            flags.theme = vendorAddon
          }
        }
      }

      /**
       * composizione dei flag
       */

      let prefix = ''
      if (flags.prefix !== undefined) {
        prefix = flags.prefix
      }

      let basename = '' // se vuoto viene definito da loadsetting (default nome dell'host)
      if (flags.basename !== undefined) {
        basename = flags.basename
      }

      /**
       * Analisi del tipo di compressione del kernel
       *
       */
      const compressors = new Compressors()
      await compressors.populate()
      let fastest = 'gzip'
      if (compressors.isEnabled.zstd) {
        fastest = 'zstd -Xcompression-level 1 -b 262144'
      } else if (compressors.isEnabled.lz4) {
        fastest = 'lz4'
      }

      /**
       * jessie e stretch will use gzip for fastest
      */
      const settings = new Settings()
      if (settings.distro.versionLike === 'jessie' || settings.distro.versionLike === 'stretch') {
        fastest = 'gzip'
      }

      let compression = '' // se vuota, compression viene definita da loadsettings, default xz
      if (flags.fast) {
        compression = fastest
      } else if (flags.normal) {
        compression = 'xz'
      } else if (flags.max) {
        compression = 'xz -Xbcj x86'
      }

      const backup = flags.backup

      const verbose = flags.verbose

      const scriptOnly = flags.script

      const yolkRenew = flags.yolk

      const release = flags.release
      if (release) {
        compression = 'xz -Xbcj x86'
      }

      /**
       * theme: if not defined will use eggs
       */
      let theme = 'eggs'
      if (flags.theme !== undefined) {
        theme = flags.theme
      }

      const i = await Config.thatWeNeed(verbose)
      if ((i.needApt || i.configurationInstall || i.configurationRefresh || i.distroTemplate) && (await Utils.customConfirm('Select yes to continue...'))) {
        await Config.install(i, verbose)
      }

      const myAddons = {} as IMyAddons
      if (flags.addons != undefined) {
        if (flags.addons.includes('adapt')) {
          myAddons.adapt = true
        }

        if (flags.addons.includes('ichoice')) {
          myAddons.ichoice = true
        }

        if (flags.addons.includes('pve')) {
          myAddons.pve = true
        }

        if (flags.addons.includes('rsupport')) {
          myAddons.rsupport = true
        }
      }

      Utils.titles(this.id + ' ' + this.argv)
      const ovary = new Ovary(prefix, basename, theme, compression)
      Utils.warning('Produce an egg...')
      if (await ovary.fertilization()) {
        await ovary.produce(backup, scriptOnly, yolkRenew, release, myAddons, verbose)
        ovary.finished(scriptOnly)
      }
    }
  }
}
