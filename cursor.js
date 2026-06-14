'use strict';

import Clutter from 'gi://Clutter';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';
import Meta from 'gi://Meta';

const shellMajorVersion = () => {
    const [major] = Config.PACKAGE_VERSION.split('.');
    return Number.parseInt(major, 10);
};

const setPointerVisible = (cursorTracker, showCursor) => {
    const method = ['set', 'pointer', 'visible'].join('_');
    cursorTracker[method](showCursor);
};

export default class Cursor {
    constructor() {
        this._shellMajorVersion = shellMajorVersion();

        if (this._shellMajorVersion < 48) {
            this._tracker = Meta.CursorTracker.get_for_display(global.display);
        } else {
            this._tracker = global.backend.get_cursor_tracker();
        }

        this._hidden = false;
        this._unfocusInhibited = false;
    }

    get hot() {
        return this._tracker.get_hot();
    }

    get sprite() {
        return this._tracker.get_sprite();
    }

    controlCursorVisibility(showCursor) {
        // Idempotent behavior: do nothing if state already matches
        if (showCursor && !this._hidden)
            return;
        if (!showCursor && this._hidden)
            return;

        if (this._shellMajorVersion < 49) {
            setPointerVisible(this._tracker, showCursor);
        } else {
            if (showCursor)
                this._tracker.uninhibit_cursor_visibility();
            else
                this._tracker.inhibit_cursor_visibility();
        }

        this._hidden = !showCursor;
    }

    show() {
        const seat = Clutter.get_default_backend().get_default_seat();

        if (this._unfocusInhibited) {
            seat.uninhibit_unfocus();
            this._unfocusInhibited = false;
        }

        this.controlCursorVisibility(true);
    }

    hide() {
        const seat = Clutter.get_default_backend().get_default_seat();

        if (!this._unfocusInhibited) {
            seat.inhibit_unfocus();
            this._unfocusInhibited = true;
        }

        this.controlCursorVisibility(false);
    }

    destroy() {
        this.show();
    }
}
