import { Loader2 } from 'lucide-react';
import React from 'react'

const Loading = () => {
  return (
			<div className=" flex flex-1 flex-col justify-center items-center">
				<Loader2 className="animate-spin my-4 text-zinc-500 h-7 w-7" />
				<p className="text-sm text-zinc-500 dark:text-zinc-400">
					Loading Messages...
				</p>
			</div>
		);
}

export default Loading
