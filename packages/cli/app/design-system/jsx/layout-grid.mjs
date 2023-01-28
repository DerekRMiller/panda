import { createElement } from 'react'

export function LayoutGrid(props) {
  const { count = 12, margin, gutter = '24px', maxWidth, outline } = props
  const hasMaxWidth = maxWidth != null
  return createElement('div', {
    className: 'panda-layout-grid',
    style: {
      '--gutter': gutter,
      '--count': count,
      '--max-width': hasMaxWidth ? maxWidth : 'initial',
      '--margin-x': hasMaxWidth ? 'auto' : undefined,
      '--padding-x': !hasMaxWidth ? margin : undefined,
    },
    children: Array.from({ length: count }).map((_, i) =>
      createElement('span', {
        'data-variant': outline ? 'outline' : 'bg',
        key: i,
        className: 'panda-layout-grid__item',
      }),
    ),
  })
}