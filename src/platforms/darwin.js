/*
   Copyright 2020 AryToNeX

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
"use strict";

const Platform = require("./_platform.js");

module.exports = class Darwin extends Platform {

	static init(win, _options){
		this._wrapVibrancy(win, _options.vibrancy || null);
		
		Object.defineProperty(win, "setBlur", {
			get: () => (blur) => this.setBlur(win, blur)
		});
	}

	static setBlur(win, bool){
		return Promise.resolve(win.setVibrancy(bool ? win.vibrancy : null));
	}

	static getBlur(win){
		return Promise.resolve(win.getVibrancy() === null);
	}

	/**
	 * Note for everyone, not just developers and contributors
	 * the win.vibrancy variable should always return a string.
	 * It can return null but only initially, when the vibrancy is not set.
	 * It MUST NOT return null afterwards, even if win.setBlur(false) has been called.
	 * win.vibrancy defines the vibrancy effect to be used when blurring.
	 */
	static _wrapVibrancy(win, vibrancyInitialValue = "fullscreen-ui"){
		// Wrap the original setVibrancy
		const originalFunction = win.setVibrancy;
		
		// Set an array of two values
		// [
		//   Vibrancy value to be reported,
		//   Current applied value (can be null in case of blur = false)
		// ]
		let _vibrancy = [vibrancyInitialValue, vibrancyInitialValue];
		
		// Here we define the actual win.vibrancy variable
		Object.defineProperty(win, "vibrancy", {
			get: () => _vibrancy,
			set: async (_newVibrancy) => {
				// Yeet any undefined value
				if(typeof _newVibrancy === "undefined")
					return;
				
				// Handle Electron handling "" vibrancy as null (disables stuff)
				if(_newVibrancy === "")
					_newVibrancy = null;
				
				// If the new vibrancy is null, set the internal vibrancy to null
				// and call the original function to reflect the change, then return.
				if(_newVibrancy === null){
					originalFunction(null);
					_vibrancy[1] = null;
					return;
				}
				
				// Set the new vibrancy to the nominal one
				_vibrancy[0] = _newVibrancy;
				// Update the actual vibrancy if it's not null
				if(_vibrancy[1] !== null){
					_vibrancy[1] = _vibrancy[0];
					originalFunction(_vibrancy);
				}
			}
		});
		
		// Bind the new wrapped setVibrancy function and apply it
		const boundFunction = ((vibrancy) => {this.vibrancy = vibrancy;}).bind(win);
		Object.defineProperty(win, "setVibrancy", {
			get: () => boundFunction
		});
		
		// Now we need an exposed method to get the correct blur status
		Object.defineProperty(win, "getBlur", {
			get: () => _vibrancy[1] === null
		});
	}
}
