/**
 * penguins-eggs: incubator.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import fs  from 'fs'
import path  from 'path'
import shx  from 'shelljs'
import Utils from '../utils'
import { IRemix, IDistro } from '../../interfaces'

import { Jessie } from './distros/jessie'
import { Buster } from './distros/buster'
import { Focal } from './distros/focal'
import { Bionic } from './distros/bionic'

import Pacman from '../pacman'
import { installer } from './installer'
import { IInstaller } from '../../interfaces/i-installer'

const exec = require('../../lib/utils').exec



/**
 *
 */
export default class Incubator {
   verbose = false

   installer = {} as IInstaller

   remix: IRemix

   distro: IDistro

   user_opt: string

   /**
    *
    * @param remix
    * @param distro
    * @param verbose
    */
   constructor(remix: IRemix, distro: IDistro, user_opt = 'live', verbose = false) {
      this.installer = installer()
      this.remix = remix
      this.distro = distro
      this.user_opt = user_opt
      this.verbose = verbose
      if (remix.branding === undefined) {
         remix.branding = 'eggs'
      }
   }

   /**
    * config
    */
   async config(release = false) {
      const verbose = true
      const echo = Utils.setEcho(verbose)

      this.createInstallerDirs()
      // DEBIAN
      if (this.distro.versionLike === 'jessie') {
         const jessie = new Jessie(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await jessie.create()
      } else if (this.distro.versionLike === 'stretch') {
         const stretch = new Jessie(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await stretch.create()
      } else if (this.distro.versionLike === 'buster') {
         const buster = new Buster(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await buster.create()
      } else if (this.distro.versionLike === 'bullseye') {
         const bullseye = new Buster(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await bullseye.create()
      } else if (this.distro.versionLike === 'bookworm') {
         const bookworm = new Buster(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await bookworm.create()
         // DEVUAN

      } else if (this.distro.versionLike === 'beowulf') {
         const beowulf = new Buster(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await beowulf.create()
      } else if (this.distro.versionLike === 'chimaera') {
         const chimaera = new Buster(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await chimaera.create()
      } else if (this.distro.versionLike === 'daedalus') {
         const daedalus = new Buster(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await daedalus.create()

         // UBUNTU
      } else if (this.distro.versionLike === 'focal') {
         const focal = new Focal(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await focal.create()
      } else if (this.distro.versionLike === 'groovy') {
         const groovy = new Focal(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await groovy.create()
      } else if (this.distro.versionLike === 'hirsute') {
         const hirsute = new Focal(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await hirsute.create()
      } else if (this.distro.versionLike === 'impish') {
         const impish = new Focal(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await impish.create()
      } else if (this.distro.versionLike === 'jammy') {
         const jammy = new Focal(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await jammy.create()
      } else if (this.distro.versionLike === 'bionic') {
         const bionic = new Bionic(this.installer, this.remix, this.distro, release, this.user_opt, this.verbose)
         await bionic.create()
      }
      this.createBranding()

   }

   /**
    *
    */
   private createInstallerDirs() {
      if (this.installer.name !== 'calamares') {
         // Remove krill configuration and multiarc if present
         try {
            shx.exec('rm ' + this.installer.configuration + ' -rf')
         } catch (error) {
            console.log('error: ' + error + ' removing ' + this.installer.configuration + ' -rf')
         }
         try {
            shx.exec('rm ' + this.installer.multiarch + ' -rf')
         } catch (error) {
            console.log('error: ' + error + ' removing ' + this.installer.multiarch + ' -rf')
         }
      }

      // rootConfiguration krill calamares
      if (!fs.existsSync(this.installer.configuration)) {
         try {
            fs.mkdirSync(this.installer.configuration)
         } catch (error) {
            console.log('error: ' + error + ' creating ' + this.installer.configuration)
         }
      }

      if (!fs.existsSync(this.installer.configuration + 'branding')) {
         try {
            fs.mkdirSync(this.installer.configuration + 'branding')
         } catch (error) {
            console.log('error: ' + error + ' creating ' + this.installer.configuration + 'branding')
         }
      }

      if (!fs.existsSync(this.installer.configuration + 'branding/eggs')) {
         try {
            fs.mkdirSync(this.installer.configuration + 'branding/eggs')
         } catch (error) {
            console.log('error: ' + error + ' creating ' + this.installer.configuration + 'branding/eggs')
         }
      }

      if (!fs.existsSync(this.installer.configuration + 'modules')) {
         try {
            fs.mkdirSync(this.installer.configuration + 'modules')
         } catch (error) {
            console.log('error: ' + error + ' creating ' + this.installer.configuration + 'modules')
         }
      }

      if (!fs.existsSync(this.installer.multiarch)) {
         try {
            fs.mkdirSync(this.installer.multiarch)
         } catch (error) {
            console.log('error: ' + error + ' creating ' + this.installer.multiarch)
         }
      }

      if (!fs.existsSync(this.installer.multiarchModules)) {
         try {
            fs.mkdirSync(this.installer.multiarchModules)
         } catch (error) {
            console.log('error: ' + error + ' creating ' + this.installer.multiarchModules)
         }
      }


      /**
       * ADDONS (only for calamares)
       */
      if (this.installer.name === 'calamares') {
         const calamaresBranding = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/calamares/branding`)
         if (fs.existsSync(calamaresBranding)) {
            if (!fs.existsSync(this.installer.configuration + `branding/${this.remix.branding}`)) {
               try {
                  fs.mkdirSync(this.installer.configuration + `branding/${this.remix.branding}`)
               } catch (error) {
                  console.log('error: ' + error + ' creating ' + this.installer.configuration + `branding/${this.remix.branding}`)
               }
            }
            shx.cp(calamaresBranding + '/*', this.installer.configuration + `branding/${this.remix.branding}/`)
         } else {
            console.log(`${calamaresBranding} not found!`)
            process.exit()
         }

         const calamaresIcon = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/artwork/install-debian.png`)
         if (fs.existsSync(calamaresIcon)) {
            shx.cp(calamaresIcon, '/usr/share/icons/')
         } else {
            console.log(`${calamaresIcon} not found!`)
            process.exit()
         }

         const calamaresLauncher = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/applications/install-debian.desktop`)
         if (fs.existsSync(calamaresLauncher)) {
            shx.cp(calamaresLauncher, '/usr/share/applications/')
         } else {
            console.log(`${calamaresLauncher} not found!`)
            process.exit()
         }
         // script di avvio
         shx.cp(path.resolve(__dirname, '../../../assets/calamares/install-debian'), '/sbin/install-debian')
      }
   }

   /**
    *
    */
   private createBranding() {

      const branding = require('./branding').branding
      const dir = this.installer.configuration + 'branding/' + this.remix.branding + '/'
      if (!fs.existsSync(dir)) {
         shx.exec(dir + ' -p')
      }
      const file = dir + 'branding.desc'
      const content = branding(this.remix, this.distro, this.verbose)
      write(file, content, this.verbose)
   }

   /**
    * non dovrebbe servire
    */
   private async createInstallDebian() {
      const scriptInstallDebian = require('./calamares-modules/scripts/install-debian').installDebian
      const scriptDir = `/usr/bin/`
      const scriptFile = scriptDir + 'install-debian'
      const scriptContent = scriptInstallDebian()
      write(scriptFile, scriptContent, this.verbose)
      await exec(`chmod +x ${scriptFile}`)
   }
}

/**
 *
 * @param file
 * @param content
 * @param verbose
 */
function write(file: string, content: string, verbose = false) {
   if (verbose) {
      console.log(`calamares: create ${file}`)
   }
   fs.writeFileSync(file, content, 'utf8')
}
