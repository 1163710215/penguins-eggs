/**
 * penguins-eggs: jessie.ts
 *
 * it work both: jessie
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import fs from 'node:fs'
import shx from 'shelljs'
import yaml from 'js-yaml'
import path from 'node:path'

import { IRemix, IDistro } from '../../../interfaces'
import { IInstaller } from '../../../interfaces/i-installer'
import Fisherman from '../fisherman'

import { exec } from '../../../lib/utils'

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

  /**
   * @param remix
   * @param distro
   * @param displaymanager
   * @param verbose
   */
  constructor(installer: IInstaller, remix: IRemix, distro: IDistro, user_opt: string, release = false, verbose = false) {
    this.installer = installer
    this.remix = remix
    this.distro = distro
    this.user_opt = user_opt
    this.verbose = verbose
    this.release = release
  }

  /**
   *
   */
  async create() {
    const fisherman = new Fisherman(this.distro, this.installer, this.verbose)

    await fisherman.settings(this.remix.branding)

    await fisherman.buildModule('partition', this.remix.branding)
    await fisherman.buildCalamaresModule('sources-yolk', true)
    await fisherman.moduleRemoveuser(this.user_opt)
    await fisherman.buildCalamaresModule('sources-yolk-unmount', false)
  }
}
