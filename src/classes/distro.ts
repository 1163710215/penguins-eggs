/**
 * penguins-eggs
 * class: distro.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'
import shell from 'shelljs'

import { IDistro } from '../interfaces/index.js'
import Utils from './utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Classe
 */
class Distro implements IDistro {
  bugReportUrl: string
  codenameId: string
  codenameLikeId: string
  distroId: string
  distroLike: string
  familyId: string
  homeUrl: string
  isCalamaresAvailable: boolean
  isolinuxPath: string
  liveMediumPath: string
  memdiskPath: string
  pxelinuxPath: string
  releaseId: string
  releaseLike: string
  squashfs: string
  supportUrl: string
  syslinuxPath: string
  usrLibPath: string

  /**
   * Costruttore
   */
  constructor() {
    this.bugReportUrl = 'https://github.com-pieroproietti/penguins-eggs/issue'
    this.codenameId = ''
    this.codenameLikeId = ''
    this.distroId = ''
    this.distroLike = ''
    this.familyId = 'debian'
    this.homeUrl = 'https://penguins-eggs.net'
    this.isCalamaresAvailable = true
    this.isolinuxPath = ''
    this.liveMediumPath = '/run/live/medium/'
    this.memdiskPath = ''
    this.pxelinuxPath = ''
    this.releaseId = ''
    this.releaseLike = ''
    this.squashfs = 'live/filesystem.squashfs'
    this.supportUrl = 'https://penguins-eggs.net'
    this.syslinuxPath = ''
    this.usrLibPath = '/usr/lib'

    const os_release = '/etc/os-release'
    if (fs.existsSync(os_release)) {
      let lines: string[] = []
      if (fs.existsSync(os_release)) {
        const data = fs.readFileSync(os_release, 'utf8')
        lines = data.split('\n')
      }

      // per ogni riga
      for (const line of lines) {
        if (line.startsWith('HOME_URL=')) {
          this.homeUrl = line.slice('HOME_URL='.length).replaceAll('"', '')
        } else if (line.startsWith('SUPPORT_URL=')) {
          this.supportUrl = line.slice('SUPPORT_URL='.length).replaceAll('"', '')
        } else if (line.startsWith('BUG_REPORT_URL=')) {
          this.bugReportUrl = line.slice('BUG_REPORT_URL='.length).replaceAll('"', '')
        }
      }
    }

    /**
     * lsb_release -cs per codename (version)
     * lsb_release -is per distribuzione
     * lsb_release -rs per release
     */
    this.codenameId = shell.exec('lsb_release -cs', { silent: true }).stdout.toString().trim()
    this.releaseId = shell.exec('lsb_release -rs', { silent: true }).stdout.toString().trim()
    this.distroId = shell.exec('lsb_release -is', { silent: true }).stdout.toString().trim()

    /**
     * releaseLike = releaseId
     */
    this.releaseLike = this.releaseId

    /**
     * Per casi equivoci conviene normalizzare codenameId
     *  -i, --id           show distributor ID
     *  -r, --release      show release number of this distribution
     *  -c, --codename     show code name of this distribution
     */
    if (this.distroId === 'Debian' && this.releaseId === 'unstable' && this.codenameId === 'sid') {
      this.codenameId = 'trixie'
    } else if (this.distroId === 'Debian' && this.releaseId === 'testing/unstable') {
      this.codenameId = 'trixie'
      this.releaseLike = 'unstable'
    }

    /**
     * Analisi: codenameId
     */
    switch (this.codenameId) {
      case 'jessie': {
        // Debian 8 jessie
        this.distroLike = 'Debian'
        this.codenameLikeId = 'jessie'
        this.liveMediumPath = '/lib/live/mount/medium/'
        this.isCalamaresAvailable = false

        break
      }

      case 'stretch': {
        // Debian 9 stretch
        this.distroLike = 'Debian'
        this.codenameLikeId = 'stretch'
        this.liveMediumPath = '/lib/live/mount/medium/'
        this.isCalamaresAvailable = false

        break
      }

      case 'buster': {
        // Debian 10 buster
        this.distroLike = 'Debian'
        this.codenameLikeId = 'buster'

        break
      }

      case 'bullseye': {
        // Debian 11 bullseye
        this.distroLike = 'Debian'
        this.codenameLikeId = 'bullseye'

        break
      }

      case 'bookworm': {
        // Debian 12 bookworm
        this.distroLike = 'Debian'
        this.codenameLikeId = 'bookworm'

        break
      }

      case 'trixie': {
        // Debian 13 trixie
        this.distroLike = 'Debian'
        this.codenameLikeId = 'trixie'

        break
      }

      case 'beowulf': {
        // Devuab 3 beowulf
        this.distroLike = 'Devuan'
        this.codenameLikeId = 'beowulf'

        break
      }

      case 'chimaera': {
        // Devuab 4 chimaera
        this.distroLike = 'Devuan'
        this.codenameLikeId = 'chimaera'

        break
      }

      case 'daedalus': {
        // Devuan 5 daedalus
        this.distroLike = 'Devuan'
        this.codenameLikeId = 'daedalus'

        break
      }

      /**
       * Ubuntu LTS + actual
       */

      case 'bionic': {
        // Ubuntu 18.04 bionic LTS eol aprile 2023
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'bionic'
        this.liveMediumPath = '/lib/live/mount/medium/'

        break
      }

      case 'focal': {
        // Ubuntu 20.04 focal LTS
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'focal'

        break
      }

      case 'jammy': {
        // Ubuntu 22.04 jammy LTS
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'jammy'

        break
      }

      case 'noble': {
        // Ubuntu 24.04 noble LTS
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'noble'

        break
      }

      case 'devel': {
        // Ubuntu rhino
        this.distroLike = 'Ubuntu'
        this.codenameLikeId = 'devel'

        break
      }

      /**
       * Arch Linux/Garuda
       */
      case 'Spizaetus':
      case 'n/a':
      case 'rolling': {
        // Arch,  ArcoLinux, BlendOS, EndeavourOS, Garuda, RebornOS
        this.familyId = 'archlinux'
        this.distroLike = 'Arch'
        this.codenameId = 'rolling'
        this.codenameLikeId = 'rolling'
        this.liveMediumPath = '/run/archiso/bootmnt/'
        this.squashfs = `arch/x86_64/airootfs.sfs`

        break
      }

      default: {
        /**
         * find in ./conf/derivaties
         */
        interface IDistros {
          distroLike: string
          family: string
          id: string // codenameId
          ids: string[]
        }

        /**
         * patch per Roy VERIFICARE
         */
        let found = false
        let file = path.resolve(__dirname, '../../conf/derivatives.yaml')
        if (fs.existsSync('/etc/penguins-eggs.d/derivatives.yaml')) {
          file = '/etc/penguins-eggs.d/derivatives.yaml'
        }

        const content = fs.readFileSync(file, 'utf8')
        const distros = yaml.load(content) as IDistros[]
        for (const distro of distros) {
          if (distro.ids !== undefined) {
            for (let n = 0; n < distro.ids.length; n++) {
              if (this.codenameId === distro.ids[n]) {
                found = true
                this.distroLike = distro.distroLike
                this.codenameLikeId = distro.id
                this.familyId = distro.family
              }
            }
          }
        }

        if (!found) {
          console.log(`This distro ${this.distroId}/${this.codenameId} is not yet recognized!`)
          console.log('')
          console.log('You can edit /usr/lib/penguins-eggs/conf/derivatives.yaml to add it -')
          console.log('after that - run: sudo eggs dad -d to re-configure eggs.')
          console.log('If you can create your new iso, you can contribute to the project')
          console.log('by suggesting your modification.')
          process.exit(0)
        }
      }
    }

    /**
     * setting paths: syslinux, isolinux, usrLibPath
     */
    switch (this.familyId) {
      case 'debian': {
        this.isolinuxPath = '/usr/lib/ISOLINUX/'
        this.syslinuxPath = '/usr/lib/syslinux/modules/bios/'
        this.pxelinuxPath = '/usr/lib/PXELINUX/'
        this.memdiskPath = '/usr/lib/syslinux/'
        this.usrLibPath = '/usr/lib/' + Utils.usrLibPath()

        break
      }

      case 'archlinux': {
        this.syslinuxPath = '/usr/lib/syslinux/bios/'
        this.pxelinuxPath = this.syslinuxPath
        this.usrLibPath = '/usr/lib/'
        this.memdiskPath = this.syslinuxPath
        this.isolinuxPath = this.syslinuxPath

        break
      }

      // No default
    } // Fine analisi codenameId

    /**
     * if lsb-release exists
     */
    const lsbConfig = '/etc/lsb-release'
    if (fs.existsSync(lsbConfig)) {
      this.distroId = Utils.searchOnFile(lsbConfig, `DISTRIB_ID`)
      this.codenameId = Utils.searchOnFile(lsbConfig, `DISTRIB_CODENAME`)
    }

    /**
     * ManjaroLinux and BigLinux
     */

    if (this.distroId === 'ManjaroLinux' || this.distroId.toLowerCase().includes('biglinux')) {
      this.liveMediumPath = '/run/miso/bootmnt/'
      this.squashfs = 'manjaro/x86_64/livefs.sfs'
    }
  }
}

export default Distro
