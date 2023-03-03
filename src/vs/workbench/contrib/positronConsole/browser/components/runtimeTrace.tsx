/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2023 Posit Software, PBC. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./runtimeTrace';
import * as React from 'react';
import { RuntimeItemTrace } from 'vs/workbench/services/positronConsole/common/classes/runtimeItemTrace';
import { ANSIOutputLines } from 'vs/workbench/contrib/positronConsole/browser/components/ansiOutputLines';

// RuntimeTraceProps interface.
export interface RuntimeTraceProps {
	runtimeItemTrace: RuntimeItemTrace;
}

/**
 * Formats a timestamp.
 * @param timestamp The timestamp.
 * @returns The formatted timestamp.
 */
const formatTimestamp = (timestamp: Date) => {
	const toTwoDigits = (v: number) => v < 10 ? `0${v}` : v;
	const toFourDigits = (v: number) => v < 10 ? `000${v}` : v < 1000 ? `0${v}` : v;
	return `${toTwoDigits(timestamp.getHours())}:${toTwoDigits(timestamp.getMinutes())}:${toTwoDigits(timestamp.getSeconds())}.${toFourDigits(timestamp.getMilliseconds())}`;
};

/**
 * RuntimeTrace component.
 * @param props A RuntimeTraceProps that contains the component properties.
 * @returns The rendered component.
 */
export const RuntimeTrace = ({ runtimeItemTrace }: RuntimeTraceProps) => {
	// Render.
	return (
		<div className='runtime-trace'>
			<div>
				{formatTimestamp(runtimeItemTrace.timestamp)}
			</div>
			<ANSIOutputLines outputLines={runtimeItemTrace.outputLines} />
		</div>
	);
};
