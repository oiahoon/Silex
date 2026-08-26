/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { describe, expect, it } from '@jest/globals'
import { Editor } from 'grapesjs'
import cssProps from './css-props'

type PropertyConfig = {
  property?: string
  type?: string
  units?: string[]
  fixedValues?: string[]
  options?: { id: string }[]
  properties?: PropertyConfig[]
}

function configureStyleProperties() {
  const added: { sector: string; config: PropertyConfig; at?: number }[] = []
  const removed: { sector: string; property: string }[] = []
  let onLoad: (() => void) | undefined

  const contentSector = {
    get: () => [],
    addProperty: () => undefined,
    set: () => undefined,
    getProperties: () => [],
    on: () => undefined,
    off: () => undefined,
  }
  const editor = {
    StyleManager: {
      addType: () => undefined,
      addProperty: (sector: string, config: PropertyConfig, options?: { at?: number }) => {
        added.push({ sector, config, at: options?.at })
      },
      removeProperty: (sector: string, property: string) => {
        removed.push({ sector, property })
      },
      getSector: () => contentSector,
      getSelected: () => undefined,
    },
    SelectorManager: {
      states: { add: () => undefined },
    },
    on: (events: string, callback: () => void) => {
      if (events === 'load') onLoad = callback
    },
  }

  cssProps(editor as unknown as Editor, {})
  onLoad?.()

  return { added, removed }
}

describe('CSS style properties', () => {
  it('registers text underline offset separately from text decoration', () => {
    const { added } = configureStyleProperties()
    const textDecoration = added.find(({ config }) => config.property === 'text-decoration')
    const underlineOffset = added.find(({ config }) => config.property === 'text-underline-offset')

    expect(textDecoration?.config.properties?.map(({ property }) => property))
      .not.toContain('text-underline-offset')
    expect(underlineOffset).toMatchObject({
      sector: 'typography',
      at: 11,
      config: {
        type: 'integer',
        units: ['px', 'em', 'rem', '%'],
        fixedValues: ['auto', 'inherit', 'initial', 'revert', 'unset'],
      },
    })
  })

  it('registers a two-axis transform origin next to transform', () => {
    const { added } = configureStyleProperties()
    const transformOrigin = added.find(({ config }) => config.property === 'transform-origin')

    expect(transformOrigin).toMatchObject({
      sector: 'extra',
      at: 3,
      config: {
        type: 'composite',
        properties: [{
          property: 'transform-origin-x',
          fixedValues: ['left', 'center', 'right'],
        }, {
          property: 'transform-origin-y',
          fixedValues: ['top', 'center', 'bottom'],
        }],
      },
    })
  })

  it('preserves transition controls while expanding the property list', () => {
    const { added, removed } = configureStyleProperties()
    const transition = added.find(({ config }) => config.property === 'transition')

    expect(removed).toContainEqual({ sector: 'extra', property: 'transition' })
    expect(transition).toMatchObject({ sector: 'extra', at: 1, config: { type: 'stack' } })
    expect(transition?.config.properties?.map(({ property }) => property)).toEqual([
      'transition-property',
      'transition-duration',
      'transition-timing-function',
    ])
    expect(transition?.config.properties?.[0].options?.map(({ id }) => id)).toEqual([
      'all',
      'width',
      'height',
      'background-color',
      'transform',
      'box-shadow',
      'opacity',
      'filter',
      'color',
      'border-color',
      'backdrop-filter',
      'visibility',
    ])
  })
})
