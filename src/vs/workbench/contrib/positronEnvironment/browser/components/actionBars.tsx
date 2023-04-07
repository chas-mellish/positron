/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2022 Posit Software, PBC. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./actionBars';
import * as React from 'react';
import { PropsWithChildren, useEffect, useState } from 'react'; // eslint-disable-line no-duplicate-imports
import { localize } from 'vs/nls';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { IContextKeyService } from 'vs/platform/contextkey/common/contextkey';
import { IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { PositronActionBar } from 'vs/platform/positronActionBar/browser/positronActionBar';
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService';
import { ActionBarRegion } from 'vs/platform/positronActionBar/browser/components/actionBarRegion';
import { ActionBarButton } from 'vs/platform/positronActionBar/browser/components/actionBarButton';
import { ActionBarFilter } from 'vs/platform/positronActionBar/browser/components/actionBarFilter';
import { ActionBarSeparator } from 'vs/platform/positronActionBar/browser/components/actionBarSeparator';
import { PositronActionBarContextProvider } from 'vs/platform/positronActionBar/browser/positronActionBarContext';
import { SortingMenuButton } from 'vs/workbench/contrib/positronEnvironment/browser/components/sortingMenuButton';
import { GroupingMenuButton } from 'vs/workbench/contrib/positronEnvironment/browser/components/groupingMenuButton';
import { PositronEnvironmentServices } from 'vs/workbench/contrib/positronEnvironment/browser/positronEnvironmentState';
import { usePositronEnvironmentContext } from 'vs/workbench/contrib/positronEnvironment/browser/positronEnvironmentContext';
import { showClearEnvironmentObjectsModalDialog } from 'vs/workbench/browser/positronModalDialogs/clearEnvironmentObjectsModalDialog';
import { EnvironmentInstanceMenuButton } from 'vs/workbench/contrib/positronEnvironment/browser/components/environmentInstanceMenuButton';

// Constants.
const kSecondaryActionBarGap = 4;
const kPaddingLeft = 14;
const kPaddingRight = 8;
const kFilterTimeout = 800;

/**
 * ActionBarsProps interface.
 */
export interface ActionBarsProps extends PositronEnvironmentServices {
	// Services.
	readonly commandService: ICommandService;
	readonly configurationService: IConfigurationService;
	readonly contextKeyService: IContextKeyService;
	readonly contextMenuService: IContextMenuService;
	readonly keybindingService: IKeybindingService;
	readonly layoutService: IWorkbenchLayoutService;
}

/**
 * ActionBars component.
 * @param props An ActionBarsProps that contains the component properties.
 * @returns The rendered component.
 */
export const ActionBars = (props: PropsWithChildren<ActionBarsProps>) => {
	// Hooks.
	const positronEnvironmentContext = usePositronEnvironmentContext();
	const [filterText, setFilterText] = useState('');

	// Find text change handler.
	useEffect(() => {
		if (filterText === '') {
			return setFilterText('');
		} else {
			// Start the filter timeout.
			const filterTimeout = setTimeout(() => {
				console.log('Filter text changed - do filtering');
			}, kFilterTimeout);

			// Clear the find timeout.
			return () => clearTimeout(filterTimeout);
		}
	}, [filterText]);

	// Load workspace handler.
	const loadWorkspaceHandler = () => {
		console.log('loadWorkspaceHandler called');
	};

	// Save workspace handler.
	const saveWorkspaceHandler = () => {
		console.log('saveWorkspaceHandler called');
	};

	// Clear all environment objects handler.
	const clearAllEnvironmentObjectsHandler = async () => {
		// Show the clear environment objects modal dialog. If the user confirmed the operation, do it.
		const result = await showClearEnvironmentObjectsModalDialog(props.layoutService);
		if (result) {
			positronEnvironmentContext.activePositronEnvironmentInstance?.requestClear(
				result.includeHiddenObjects
			);
		}
	};

	// Refresh workspace objects handler.
	const refreshWorkspaceObjectsHandler = () => {
		positronEnvironmentContext.activePositronEnvironmentInstance?.requestRefresh();
	};

	// If there are no language environment, return null.
	// TODO@softwarenerd - Render something specific for this case. TBD.
	if (positronEnvironmentContext.positronEnvironmentInstances.length === 0) {
		return null;
	}

	// Render.
	return (
		<PositronActionBarContextProvider {...props}>
			<div className='action-bars'>
				<PositronActionBar size='small' paddingLeft={kPaddingLeft} paddingRight={kPaddingRight}>
					<ActionBarRegion align='left'>
						<ActionBarButton iconId='positron-open' tooltip={localize('positronLoadWorkspace', "Load workspace")} onClick={() => loadWorkspaceHandler()} />
						<ActionBarButton iconId='positron-save' tooltip={localize('positronSaveWorkspace', "Save workspace as")} onClick={() => saveWorkspaceHandler()} />
						<ActionBarSeparator />
						<ActionBarButton iconId='positron-import-data' text='Import Dataset' dropDown={true} />
						<ActionBarSeparator />
						<ActionBarButton iconId='positron-clean' tooltip={localize('positronClearAllEnvironmentObjects', "Clear all environment objects")} onClick={clearAllEnvironmentObjectsHandler} />
						<ActionBarSeparator />
						<ActionBarButton iconId='positron-test' tooltip={localize('positronTestMode', "Enter test mode")} />
					</ActionBarRegion>
					<ActionBarRegion align='right'>
						<GroupingMenuButton />
						<SortingMenuButton />
						<ActionBarButton align='right' iconId='positron-refresh' tooltip={localize('positronRefreshObjects', "Refresh workspace objects")} onClick={refreshWorkspaceObjectsHandler} />
					</ActionBarRegion>
				</PositronActionBar>
				<PositronActionBar size='small' gap={kSecondaryActionBarGap} paddingLeft={kPaddingLeft} paddingRight={kPaddingRight}>
					<ActionBarRegion align='left'>
						<EnvironmentInstanceMenuButton />
						<ActionBarSeparator />
						<ActionBarButton iconId='positron-environment' text='Global Environment' dropDown={true} tooltip={localize('positronSelectEnvironment', "Select environment")} />
					</ActionBarRegion>
					<ActionBarRegion align='right'>
						<ActionBarFilter
							width={150}
							initialFilterText={filterText}
							onFilterTextChanged={setFilterText} />
					</ActionBarRegion>
				</PositronActionBar>
			</div>
		</PositronActionBarContextProvider>
	);
};
