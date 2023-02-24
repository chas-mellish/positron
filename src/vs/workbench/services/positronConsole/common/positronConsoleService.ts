/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2023 Posit Software, PBC. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import { Emitter } from 'vs/base/common/event';
import { Disposable } from 'vs/base/common/lifecycle';
import { ILogService } from 'vs/platform/log/common/log';
import { ILanguageService } from 'vs/editor/common/languages/language';
import { PositronConsoleInstance } from 'vs/workbench/services/positronConsole/common/positronConsoleInstance';
import { IPositronConsoleService } from 'vs/workbench/services/positronConsole/common/interfaces/positronConsoleService';
import { IPositronConsoleInstance } from 'vs/workbench/services/positronConsole/common/interfaces/positronConsoleInstance';
import { formatLanguageRuntime, ILanguageRuntime, ILanguageRuntimeService } from 'vs/workbench/services/languageRuntime/common/languageRuntimeService';
import { InstantiationType, registerSingleton } from 'vs/platform/instantiation/common/extensions';

/**
 * PositronConsoleService class.
 */
export class PositronConsoleService extends Disposable implements IPositronConsoleService {
	//#region Private Properties

	/**
	 * A map of the running Positron console instances by runtime ID.
	 */
	private readonly _runningPositronConsoleInstancesByRuntimeId = new Map<string, IPositronConsoleInstance>();

	/**
	 * A map of the running Positron console instances by language ID.
	 */
	private readonly _runningPositronConsoleInstancesByLanguageId = new Map<string, IPositronConsoleInstance>();

	/**
	 * The active Positron console instance.
	 */
	private _activePositronConsoleInstance?: IPositronConsoleInstance;

	/**
	 * The onDidStartPositronConsoleInstance event emitter.
	 */
	private readonly _onDidStartPositronConsoleInstanceEmitter = this._register(new Emitter<IPositronConsoleInstance>);

	/**
	 * The onDidChangeActivePositronConsoleInstance event emitter.
	 */
	private readonly _onDidChangeActivePositronConsoleInstanceEmitter = this._register(new Emitter<IPositronConsoleInstance | undefined>);

	//#endregion Private Properties

	//#region Constructor & Dispose

	/**
	 * Constructor.
	 * @param _languageRuntimeService The language runtime service.
	 * @param _languageService The language service.
	 * @param _logService The log service.
	 */
	constructor(
		@ILanguageRuntimeService private _languageRuntimeService: ILanguageRuntimeService,
		@ILanguageService _languageService: ILanguageService,
		@ILogService private _logService: ILogService,
	) {
		// Call the disposable constrcutor.
		super();

		// Start a Positron console instance for each running language runtime.
		this._languageRuntimeService.runningRuntimes.forEach(runtime => {
			this.startOrUpdatePositronConsoleInstance(runtime, false);
		});

		// Get the active language runtime. If there is one, set the active Positron console instance.
		if (this._languageRuntimeService.activeRuntime) {
			const positronConsoleInstance = this._runningPositronConsoleInstancesByRuntimeId.get(this._languageRuntimeService.activeRuntime.metadata.runtimeId);
			if (positronConsoleInstance) {
				this.setActivePositronConsoleInstance(positronConsoleInstance);
			} else {
				this._logService.error(`Language runtime ${formatLanguageRuntime(this._languageRuntimeService.activeRuntime)} is active, but a Positron console instance for it was not started.`);
			}
		}

		// Register the onWillStartRuntime event handler so we start a new Positron console instance before a runtime starts up.
		this._register(this._languageRuntimeService.onWillStartRuntime(runtime => {
			this.startOrUpdatePositronConsoleInstance(runtime, true);
		}));

		// Register the onDidStartRuntime event handler so we activate the new Positron console instance when the runtime starts up.
		this._register(this._languageRuntimeService.onDidStartRuntime(runtime => {
			this.startOrUpdatePositronConsoleInstance(runtime, true);
		}));

		// Register the onDidStartRuntime event handler so we activate the new Positron console instance when the runtime starts up.
		this._register(this._languageRuntimeService.onDidFailStartRuntime(runtime => {
			//this.startOrUpdatePositronConsoleInstance(runtime, true);
		}));


		// Register the onDidReconnectRuntime event handler so we start a new Positron console instance when a runtime is reconnected.
		this._register(this._languageRuntimeService.onDidReconnectRuntime(runtime => {
			this.startOrUpdatePositronConsoleInstance(runtime, true);
		}));





		// Register the onDidStartRuntime event handler so we start a new REPL for each runtime that is started.
		this._register(this._languageRuntimeService.onDidStartRuntime(runtime => {
			this.startOrUpdatePositronConsoleInstance(runtime, false);
		}));

		// Register the onDidChangeActiveRuntime event handler so we can activate the REPL for the active runtime.
		this._register(this._languageRuntimeService.onDidChangeActiveRuntime(runtime => {
			if (!runtime) {
				this.setActivePositronConsoleInstance();
			} else {
				const positronConsoleInstance = this._runningPositronConsoleInstancesByRuntimeId.get(runtime.metadata.runtimeId);
				if (positronConsoleInstance) {
					this.setActivePositronConsoleInstance(positronConsoleInstance);
				} else {
					this._logService.error(`Language runtime ${formatLanguageRuntime(runtime)} became active, but a REPL instance for it is not running.`);
				}
			}
		}));
	}

	//#endregion Constructor & Dispose

	//#region IPositronConsoleService Implementation

	// Needed for service branding in dependency injector.
	declare readonly _serviceBrand: undefined;

	// An event that is fired when a REPL instance is started.
	readonly onDidStartPositronConsoleInstance = this._onDidStartPositronConsoleInstanceEmitter.event;

	// An event that is fired when the active REPL instance changes.
	readonly onDidChangeActivePositronConsoleInstance = this._onDidChangeActivePositronConsoleInstanceEmitter.event;

	// Gets the repl instances.
	get positronConsoleInstances(): IPositronConsoleInstance[] {
		return Array.from(this._runningPositronConsoleInstancesByRuntimeId.values());
	}

	// Gets the active REPL instance.
	get activePositronConsoleInstance(): IPositronConsoleInstance | undefined {
		return this._activePositronConsoleInstance;
	}

	/**
	 * Placeholder that gets called to "initialize" the PositronConsoleService.
	 */
	initialize() {
	}

	/**
	 * Executes code in a PositronConsoleInstance.
	 * @param languageId The language ID.
	 * @param code The code.
	 * @returns A value which indicates whether the code could be executed.
	 */
	executeCode(languageId: string, code: string): boolean {
		const positronConsoleInstance = this._runningPositronConsoleInstancesByLanguageId.get(languageId);
		if (!positronConsoleInstance) {
			// TODO@softwarenerd - See if we can start a new runtime for the language.
			return false;
		} else {
			positronConsoleInstance.executeCode(code);
			return true;
		}
	}

	//#endregion IPositronConsoleService Implementation

	//#region Private Methods

	/**
	 * Starts or updates a Positron console instance for the specified language runtime.
	 * @param runtime The language runtime to bind to the new Positron console instance.
	 * @param starting A value which indicates whether the runtime is starting.
	 * @returns The new Positron console instance.
	 */
	private startOrUpdatePositronConsoleInstance(runtime: ILanguageRuntime, starting: boolean): IPositronConsoleInstance {

		// Create the new Positron console instance.
		const positronConsoleInstance = new PositronConsoleInstance(runtime, true);

		// Add the Positron console instance to the running instances.
		this._runningPositronConsoleInstancesByRuntimeId.set(runtime.metadata.runtimeId, positronConsoleInstance);
		this._runningPositronConsoleInstancesByLanguageId.set(runtime.metadata.languageId, positronConsoleInstance);

		// Fire the onDidStartPositronConsoleInstance event.
		this._onDidStartPositronConsoleInstanceEmitter.fire(positronConsoleInstance);

		// Return the instance.
		return positronConsoleInstance;
	}

	/**
	 * Sets the active Positron console instance.
	 * @param positronConsoleInstance
	 */
	private setActivePositronConsoleInstance(positronConsoleInstance?: IPositronConsoleInstance) {
		// Log.
		if (positronConsoleInstance) {
			this._logService.trace(`Activating REPL for language runtime ${formatLanguageRuntime(positronConsoleInstance.runtime)}.`);
		}

		// Set the active instance and fire the onDidChangeActiveRepl event.
		this._activePositronConsoleInstance = positronConsoleInstance;
		this._onDidChangeActivePositronConsoleInstanceEmitter.fire(positronConsoleInstance);
	}

	//#endregion Private Methods
}

// Register the Positron console service.
registerSingleton(IPositronConsoleService, PositronConsoleService, InstantiationType.Delayed);
