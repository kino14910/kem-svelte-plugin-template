<script lang="ts">
	let count = $state(0);
</script>

<svelte:head>
	<title>计数器</title>
</svelte:head>

<main class="counter-page grid min-h-dvh place-items-center px-4 py-8 sm:px-8">
	<section
		aria-labelledby="counter-title"
		class="card w-full max-w-md min-w-0 space-y-6 border border-surface-200-800 bg-surface-50-900 p-5 shadow-sm sm:p-8"
	>
		<h1 id="counter-title" class="text-2xl font-bold sm:text-3xl">计数器</h1>

		<div class="card grid gap-3 bg-primary-50-950 px-4 py-8 text-center text-primary-900-100">
			<p id="counter-label" class="text-sm font-medium">当前计数</p>
			<output
				aria-labelledby="counter-label"
				class="text-6xl leading-none font-bold wrap-anywhere tabular-nums sm:text-7xl"
			>
				{count}
			</output>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<button
				type="button"
				class="btn preset-filled-primary-700-300 min-h-11 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700-300"
				onclick={() => (count += 1)}
			>
				加一
			</button>
			<button
				type="button"
				class="btn preset-outlined-surface-400-600 min-h-11 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700-300"
				disabled={count === 0}
				onclick={() => (count = 0)}
			>
				重置
			</button>
		</div>
	</section>
</main>
