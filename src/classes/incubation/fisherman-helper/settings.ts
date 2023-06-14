/**
 * 
 * @param theme 
 * @param isClone 
 */

import fs from 'fs'
import yaml from 'js-yaml'
import shx from 'shelljs'
import { displaymanager } from './displaymanager'
import Utils from '../../utils'
import { ISettings } from '../../../interfaces/i-settings'

/**
 * 
 * @param src 
 * @param dest 
 * @param theme 
 * @param isClone 
 */
export async function settings(src: string, dest: string, theme = 'eggs', isClone = false) {
    let branding = theme
    let settingsSrc = src + 'settings.yml'
    if (theme.includes('/')) {
        branding = theme.slice(Math.max(0, theme.lastIndexOf('/') + 1))
    }

    const settingsDest = dest + 'settings.conf'
    shx.cp(settingsSrc, settingsDest)
    let hasSystemd = '# '
    if (Utils.isSystemd()) {
        hasSystemd = '- '
    }

    let createUsers = '- '
    if (isClone) {
        createUsers = '# '
    }

    let hasDisplaymanager = '# '
    if (displaymanager() !== '') {
        hasDisplaymanager = '- '
    }

    shx.sed('-i', '{{hasSystemd}}', hasSystemd, settingsDest)
    shx.sed('-i', '{{hasDisplaymanager}}', hasDisplaymanager, settingsDest)
    shx.sed('-i', '{{branding}}', branding, settingsDest)
    shx.sed('-i', '{{createUsers}}', createUsers, settingsDest)

    /**
     * cfsAppend
     */
    const cfsPath = `${theme}/theme/calamares/cfs.yml`
    if (fs.existsSync(cfsPath)) {
        cfsAppend(cfsPath)
    }
}

/**
 * 
 */
function cfsAppend(cfs: string) {
    let soContent = fs.readFileSync('/etc/calamares/settings.conf', 'utf8')
    let so = yaml.load(soContent) as ISettings

    const cfsContent: string = fs.readFileSync(cfs, 'utf8')
    const cfsSteps = yaml.load(cfsContent) as []

    const execSteps = so.sequence[1].exec
    for (const execStep of execSteps) {
       if (execStep.includes('umount')) {
        so.sequence[1].exec.pop() // OK remove umount

        /**
         * insert cfsStep
         */
        for (const cfsStep of cfsSteps) {
            so.sequence[1].exec.push(cfsStep)
        }
        so.sequence[1].exec.push('end-cfs') // we will replace with umount
       }
    }
    fs.writeFileSync("/etc/calamares/settings.conf", yaml.dump(so), 'utf-8')
    shx.sed('-i', 'end-cfs', 'umount', "/etc/calamares/settings.conf")
}