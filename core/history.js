// Command History Manager
window.PAP = window.PAP || {};

PAP.CommandHistory = class CommandHistory {
    constructor(maxSteps = 50) {
        this.commands = [];
        this.currentIndex = -1;
        this.maxSteps = maxSteps;
    }

    push(command) {
        // Remove any redo history beyond current point
        this.commands.splice(this.currentIndex + 1);

        this.commands.push(command);

        // Enforce max steps
        if (this.commands.length > this.maxSteps) {
            this.commands.shift();
        } else {
            this.currentIndex++;
        }

        // Keep index valid after shift
        this.currentIndex = this.commands.length - 1;

        PAP.EventBus.emit('history:changed', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        });
    }

    undo() {
        if (!this.canUndo()) return false;

        const cmd = this.commands[this.currentIndex];
        cmd.undo();
        this.currentIndex--;

        PAP.EventBus.emit('history:changed', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        });
        PAP.EventBus.emit('history:undo', cmd);
        return true;
    }

    redo() {
        if (!this.canRedo()) return false;

        this.currentIndex++;
        const cmd = this.commands[this.currentIndex];
        cmd.redo();

        PAP.EventBus.emit('history:changed', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        });
        PAP.EventBus.emit('history:redo', cmd);
        return true;
    }

    canUndo() {
        return this.currentIndex >= 0;
    }

    canRedo() {
        return this.currentIndex < this.commands.length - 1;
    }

    clear() {
        this.commands = [];
        this.currentIndex = -1;
        PAP.EventBus.emit('history:changed', {
            canUndo: false,
            canRedo: false
        });
    }

    get length() {
        return this.commands.length;
    }
};
