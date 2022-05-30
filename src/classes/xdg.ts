/**
 * xdg-utils
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import shx from 'shelljs'
import fs, { utimesSync } from 'node:fs'
import path from 'node:path'
import Pacman from './pacman'
import Utils from './utils'

// libraries
import { exec } from '../lib/utils'
import { verify } from 'node:crypto'
import { string } from '@oclif/core/lib/flags'

const xdg_dirs = ['DESKTOP', 'DOWNLOAD', 'TEMPLATES', 'PUBLICSHARE', 'DOCUMENTS', 'MUSIC', 'PICTURES', 'VIDEOS']

/**
 * Xdg: xdg-user-dirs, etc
 * @remarks all the utilities
 */
export default class Xdg {

  /**
   *
   * @param xdg_dir
   */
  static traduce(xdg_dir = '', traduce = true): string {
    let retval = ''
    if (traduce === false) {
      // Capitalize
      retval = xdg_dir.charAt(0).toUpperCase() + xdg_dir.slice(1).toLowerCase()
      console.log(retval)
    } else {
      xdg_dirs.forEach(async (dir) => {
        if (dir === xdg_dir) {
          retval = path.basename(shx.exec(`sudo -u ${Utils.getPrimaryUser()} xdg-user-dir ${dir}`, { silent: true }).stdout.trim())
        }
      })
    }
    return retval
  }

  /**
   *
   * @param user
   * @param chroot
   * @param verbose
   */
  static async create(user: string, chroot: string, traduce = true, verbose = false) {
    const echo = Utils.setEcho(verbose)

    /**
     * Creo solo la cartella DESKTOP perchè serve per i link, eventualmente posso creare le altre
     * ma c'è il problema di traduce/non traduce
     */
    xdg_dirs.forEach(async (dir) => {
      if (dir === 'DESKTOP') {
        await Xdg.mk(chroot, `/home/${user}/` + this.traduce(dir, traduce), verbose)
      }
    })
  }

  /**
   * 
   * @param chroot 
   * @param path 
   * @param verbose 
   */
  static async mk(chroot: string, path: string, verbose = false) {
    const echo = Utils.setEcho(verbose)

    if (!fs.existsSync(chroot + path)) {
      await exec(`mkdir ${chroot}${path}`, echo)
    }
  }

  /**
   *
   * @param olduser
   * @param newuser
   * @param chroot
   */
  static async autologin(olduser: string, newuser: string, chroot = '/') {
    if (Pacman.isInstalledGui()) {

      /**
       * SLIM
       */
      if (Pacman.packageIsInstalled('slim')) {
        shx.sed('-i', 'auto_login no', 'auto_login yes', `${chroot}/etc/slim.conf`)
        shx.sed('-i', `default_user ${olduser}`, `default_user ${newuser}`, `${chroot}/etc/slim.conf`)
      }

      /**
       * LIGHTDM
       */
      if (Pacman.packageIsInstalled('lightdm')) {
        let lightdmConf = `${chroot}/etc/lightdm/lightdm.conf`
        let lightdmConfAutologin = `${chroot}/etc/lightdm/lightdm.conf.d/lightdm-autologin-greeter.conf`

        if (fs.existsSync(lightdmConfAutologin)) {
          shx.sed('-i', `autologin-user=${olduser}`, `autologin-user=${newuser}`, lightdmConfAutologin)
        } else if (fs.existsSync(lightdmConf)) {
          shx.sed('-i', `autologin-user=${olduser}`, `autologin-user=${newuser}`, lightdmConf)
        }
      }

      /**
       * SDDM
       */
      if (Pacman.packageIsInstalled('sddm')) {
        let sddmChanged = false
        // Cerco configurazione nel file sddm.conf
        const fileConf = `${chroot}/etc/sddm.conf`
        if (fs.existsSync(fileConf)) {
          const content = fs.readFileSync(fileConf)
          if (content.includes('[Autologin]')) {
            shx.sed('-i', `User=${olduser}`, `User=${newuser}`, fileConf)
            sddmChanged = true
          }
        }

        // Se non l'ho trovato, modifico /etc/sddm.conf.d/autologin.conf
        if (!sddmChanged) {
          const dirConf = `${chroot}/etc/sddm.conf.d`
          const autologin = `${dirConf}/autologin.conf`
          if (fs.existsSync(autologin)) {
            shx.sed('-i', `User=${olduser}`, `User=${newuser}`, autologin)
          } else {
            const content = `[Autologin]\nUser=${newuser}\n`
            fs.writeFileSync(autologin, content, 'utf-8')
          }
        }
      }

      /**
       * GDM/GDM3
       */
      if (Pacman.packageIsInstalled('gdm') || Pacman.packageIsInstalled('gdm3')) {
        let gdmConf = `${chroot}/etc/gdm3`
        if (Pacman.packageIsInstalled('gdm3')) {
          gdmConf = `${chroot}/etc/gdm3`
        } else if (Pacman.packageIsInstalled('gdm')) {
          gdmConf = `${chroot}/etc/gdm`
        }


        if (fs.existsSync(`${chroot}/etc/gdm3/custom.conf`)) {
          gdmConf += '/custom.conf'
        } else if (fs.existsSync(`${chroot}/etc/gdm3/daemon.conf`)) {
          gdmConf += '/daemon.conf'
        } else {
          gdmConf = `${chroot}/etc/gdm3/custom.conf`
        }

        const content = `[daemon]\nAutomaticLoginEnable=true\nAutomaticLogin=${newuser}\n`
        Utils.write(gdmConf, content)
        // shx.sed('-i', 'AutomaticLoginEnable=False', 'AutomaticLoginEnable=True', gdmConf)
        // shx.sed('-i', `AutomaticLogin=${olduser}`, `AutomaticLogin=${newuser}`, gdmConf)
      }

    }

  }

  /**
   * Copia della configuirazione in /etc/skel
   * @param user
   * @param verbose
   */
  static async skel(user: string, verbose = false) {
    const echo = Utils.setEcho(verbose)

    // Remove and create /etc/skel
    await exec('rm /etc/skel -rf', echo)
    await exec('mkdir -p /etc/skel', echo)

    // copy .bash_logout, .bashrc and .profile to /etc/skel
    await exec(`cp /home/${user}/.bash_logout /etc/skel`, echo)
    await exec(`cp /home/${user}/.bashrc /etc/skel`, echo)
    await exec(`cp /home/${user}/.profile /etc/skel`, echo)

    /**
     * copy desktop configuration
     */
    if (Pacman.packageIsInstalled('gnome-session')) {
      // we need a more clean solution
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('cinnamon-core')) {
      // use .cinnamon NOT cinnamon/ 
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.cinnamon`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('plasma-desktop')) {
      // use .kde NOT .kde/ 
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.kde`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('lxde-core')) {
      // we need a more clean solution
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('lxqt-core')) {
      // we need a more clean solution
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('mate-session-manager')) {
      // we need a more clean solution
      await rsyncIfExist(`/home/${user}/.config`, '/etc/skel', verbose)
      await rsyncIfExist(`/home/${user}/.gtkrc-2.0`, '/etc/skel', verbose)
    } else if (Pacman.packageIsInstalled('xfce4-session')) {
      // use .config/xfce4 NOT .config/xfce4/ 
      await rsyncIfExist(`/home/${user}/.config/xfce4`, '/etc/skel/.config', verbose)
      await exec(`mkdir /etc/skel/.local/share -p`, echo)
      await rsyncIfExist(`/home/${user}/.local/share/recently-used.xbel`, '/etc/skel/.local/share', verbose)
    }

    await exec('chown root:root /etc/skel -R', echo)
    await exec('chmod a+rwx,g-w,o-w /etc/skel/ -R', echo)
    await execIfExist('chmod a+rwx,g-w-x,o-wx', '/etc/skel/.bashrc', verbose)
    await execIfExist('chmod a+rwx,g-w-x,o-wx', '/etc/skel/.bash_logout', verbose)
    await execIfExist('chmod a+rwx,g-w-x,o-wx', '/etc/skel/.profile', verbose)

    // https://www.thegeekdiary.com/understanding-the-etc-skel-directory-in-linux/
    // cat /etc/defualt/useradd
    // ls -lart /etc/skel
  }
}


/**
 * execIfExist
 * @param cmd
 * @param file
 * @param verbose
 */
async function execIfExist(cmd: string, file: string, verbose = false) {
  const echo = Utils.setEcho(verbose)

  if (fs.existsSync(file)) {
    await exec(`${cmd} ${file}`, echo)
  }
}

/**
 * 
 */
async function rsyncIfExist(source: string, dest = '/etc/skel/', verbose = false) {

  const echo = Utils.setEcho(verbose)
  if (fs.existsSync(source)) {
    await exec(`rsync -avx ${source} ${dest}`, echo)
  }
}
