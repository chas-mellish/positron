/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2023 Posit Software, PBC. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./actionBar';
import * as React from 'react';
import { useEffect, useState } from 'react'; // eslint-disable-line no-duplicate-imports
import { localize } from 'vs/nls';
import { DisposableStore } from 'vs/base/common/lifecycle';
import { IReactComponentContainer } from 'vs/base/browser/positronReactRenderer';
import { PositronActionBar } from 'vs/platform/positronActionBar/browser/positronActionBar';
import { ActionBarRegion } from 'vs/platform/positronActionBar/browser/components/actionBarRegion';
import { ActionBarButton } from 'vs/platform/positronActionBar/browser/components/actionBarButton';
import { ActionBarSeparator } from 'vs/platform/positronActionBar/browser/components/actionBarSeparator';
import { PositronActionBarServices } from 'vs/platform/positronActionBar/browser/positronActionBarState';
import { usePositronConsoleContext } from 'vs/workbench/contrib/positronConsole/browser/positronConsoleContext';
import { PositronActionBarContextProvider } from 'vs/platform/positronActionBar/browser/positronActionBarContext';
import { PositronConsoleState } from 'vs/workbench/services/positronConsole/common/interfaces/positronConsoleService';
import { ConsoleInstanceMenuButton } from 'vs/workbench/contrib/positronConsole/browser/components/consoleInstanceMenuButton';

// Constants.
const kPaddingLeft = 8;
const kPaddingRight = 8;
const kInterruptButtonDelay = 250;

// ActionBarProps interface.
interface ActionBarProps {
	readonly reactComponentContainer: IReactComponentContainer;
}

/**
 * ActionBar component.
 * @param props An ActionBarProps that contains the component properties.
 * @returns The rendered component.
 */
export const ActionBar = (props: ActionBarProps) => {
	// Context hooks.
	const positronConsoleContext = usePositronConsoleContext();

	// State hooks.
	const [activePositronConsoleInstance, setActivePositronConsoleInstance] =
		useState(positronConsoleContext.positronConsoleService.activePositronConsoleInstance);
	const [showInterruptActionBarButton, setShowInterruptActionBarButton] = useState(false);
	const [interruptible, setInterruptible] = useState(false);
	const [interrupting, setInterrupting] = useState(false);

	// Main useEffect hook.
	useEffect(() => {
		// Register for active Positron console instance changes.
		positronConsoleContext.positronConsoleService.onDidChangeActivePositronConsoleInstance(
			activePositronConsoleInstance => {
				setActivePositronConsoleInstance(activePositronConsoleInstance);
				setShowInterruptActionBarButton(false);
				setInterruptible(activePositronConsoleInstance?.state === PositronConsoleState.Busy);
				setInterrupting(false);
			}
		);
	}, []);

	// Interruptible useEffect.
	useEffect(() => {
		// When the console becomes interruptible, show the interrupt button after a delay so that
		// most of the time it doesn't flash on and off too quickly.
		if (interruptible) {
			// Create the timeout.
			const timeout = setTimeout(() => {
				setShowInterruptActionBarButton(true);
			}, kInterruptButtonDelay);

			// Return the cleanup function that clears the timeout.
			return () => clearTimeout(timeout);
		}

		// Nothing needs to be cleaned up.
		return;
	}, [interruptible]);

	// Active Positron console instance useEffect hook.
	useEffect(() => {
		// Create the disposable store for cleanup.
		const disposableStore = new DisposableStore();

		// If there is an active Positron console instance, register for its onDidChangeState event.
		if (activePositronConsoleInstance) {
			disposableStore.add(activePositronConsoleInstance.onDidChangeState(state => {
				// Track whether the active Positron console instance is interruptible.
				switch (state) {
					// The Positron console instance is interruptible.
					case PositronConsoleState.Busy:
						setShowInterruptActionBarButton(false);
						setInterruptible(true);
						setInterrupting(false);
						break;

					// The Positron console instance is not interruptible.
					default:
						setShowInterruptActionBarButton(false);
						setInterruptible(false);
						setInterrupting(false);
						break;
				}
			}));
		}

		// Return the cleanup function that will dispose of the disposables.
		return () => disposableStore.dispose();
	}, [activePositronConsoleInstance]);

	// Interrupt handler.
	const interruptHandler = async () => {
		// Set the interrupting flag to debounch the button.
		setInterrupting(true);

		// Interrupt the active Positron console instance.
		activePositronConsoleInstance?.runtime.interrupt();
	};

	// Toggle trace handler.
	const toggleTraceHandler = async () => {
		positronConsoleContext.activePositronConsoleInstance?.toggleTrace();
	};

	// Clear console handler.
	const clearConsoleHandler = async () => {
		positronConsoleContext.activePositronConsoleInstance?.clearConsole();
	};

	// Render.
	return (
		<PositronActionBarContextProvider {...positronConsoleContext as PositronActionBarServices}>
			<div className='action-bar'>
				<PositronActionBar size='small' borderTop={true} borderBottom={true} paddingLeft={kPaddingLeft} paddingRight={kPaddingRight}>
					<ActionBarRegion align='left'>
						<ConsoleInstanceMenuButton {...props} />
						{showInterruptActionBarButton &&
							<ActionBarButton
								disabled={interrupting}
								iconId='positron-interrupt'
								align='left'
								tooltip={localize('positronInterruptExeuction', "Interrupt execution")}
								onClick={interruptHandler}
							/>
						}
					</ActionBarRegion>
					<ActionBarRegion align='right'>
						<ActionBarButton iconId='positron-list' align='right' tooltip={localize('positronToggleTrace', "Toggle Trace")} onClick={toggleTraceHandler} />
						<ActionBarSeparator />
						<ActionBarButton iconId='positron-trash-can' align='right' tooltip={localize('positronClearConsole', "Clear console")} onClick={clearConsoleHandler} />
					</ActionBarRegion>
				</PositronActionBar>
			</div>
		</PositronActionBarContextProvider>
	);
};
