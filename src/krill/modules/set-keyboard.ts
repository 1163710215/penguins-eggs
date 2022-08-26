/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import Utils from '../../classes/utils'
import { exec } from '../../lib/utils'

export default async function setKeyboard(this: Sequence) {
    /**
    * influence: - /etc/default/keyboard (x11)
    *            - /etc/vconsole.conf (console) 
    *            - /etc/X11/xorg.conf.d/00-keyboard.conf
    * 
    * Problem: Actually don't update /etc/default/keyboard (x11)
    *          /etc/vconsole.conf is update in installed systems
    */

    // systemd as default
    let cmd = `chroot ${this.installTarget} localectl set-keymap ${this.keyboardLayout}`
    if (!Utils.isSystemd()) {
        cmd = `chroot ${this.installTarget} setupcon ${this.toNull}`
    }

    try {
        await exec(cmd, this.echo)
    } catch (error) {
        console.log(error)
        Utils.pressKeyToExit(cmd, true)
    }


    /**
     * this must to be not necessary but...
     * 
    * force change /etc/default/keyboard (x11)
    * force change /etc/vconsole.conf
    * force change /etc/X11/xorg.conf.d/00-keyboard.conf
    */
    if (Utils.isSystemd()) {
        let content = '# KEYBOARD CONFIGURATION FILE\n\n'
        content += '# Consult the keyboard(5) manual page.\n\n'
        content += '# See penguins-eggs/src/krill/modules/set-keyboard.ts\n\n'
        content += 'XKBMODEL="' + this.keyboardModel + '"\n'
        content += 'XKBLAYOUT="' + this.keyboardLayout + '"\n'
        content += 'XKBVARIANT="' + this.keyboardVariant + '"\n'
        content += 'XKBOPTIONS=""\n'
        content += '\n'
        content += 'BACKSPACE="guess"\n'
        Utils.write(this.installTarget + '/etc/default/keyboard', content)

        content = '# See penguins-eggs/src/krill/modules/set-keyboard.ts\n\n'
        content += 'KEYMAP="' + this.keyboardLayout + '"\n'
        content += 'FONT=\n'
        content += 'FONT_MAP=\n'
        Utils.write(this.installTarget + '/etc/vconsole.conf', content)

        content = '# See penguins-eggs/src/krill/modules/set-keyboard.ts\n\n'
        content += `# Read and parsed by systemd-localed. It's probably wise not to edit this file\n`
        content += `# manually too freely.\n`
        content += `Section "InputClass"\n`
        content += `        Identifier "system-keyboard"\n`
        content += `        MatchIsKeyboard "on"\n`
        content += `        Option "XkbLayout" "` + this.keyboardLayout + `"\n`
        content += `EndSection\n`
        Utils.write(this.installTarget + '/etc/X11/xorg.conf.d/00-keyboard.conf', content)
    }
}

