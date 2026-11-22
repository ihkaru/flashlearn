<script lang="ts">
  import { ICON_PATHS, type IconName } from './iconPaths';

  interface Props {
    name: IconName;
    size?: number | string;
    strokeWidth?: number;
    class?: string;
    style?: string;
  }

  let {
    name,
    size = 16,
    strokeWidth = 2,
    class: className = '',
    style = '',
  }: Props = $props();

  const pxSize = $derived(typeof size === 'number' ? `${size}px` : size);
  const svgInner = $derived(ICON_PATHS[name] || '');
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={pxSize}
  height={pxSize}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class="fl-icon {className}"
  style="display: inline-block; vertical-align: middle; flex-shrink: 0; {style}"
  aria-hidden="true"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html svgInner}
</svg>
