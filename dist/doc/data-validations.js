"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataValidations = void 0;
class DataValidations {
    model;
    constructor(model) {
        this.model = model || {};
    }
    add(address, validation) {
        return (this.model[address] = validation);
    }
    find(address) {
        return this.model[address];
    }
    remove(address) {
        this.model[address] = undefined;
    }
}
exports.DataValidations = DataValidations;
exports.default = DataValidations;
