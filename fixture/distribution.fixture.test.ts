import { describe, expect, it } from 'vitest'

const sleep = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

describe('deterministic-ish duration fixture', () => {
  // Values are deliberately far apart. The demo asserts that the reporter runs,
  // while unit tests above validate exact binning with synthetic durations.
  it('has a fast test', async () => {
    await sleep(15)
    expect(true).toBe(true)
  })

  it('lands in the middle bin', async () => {
    await sleep(100)
    expect(true).toBe(true)
  })

  it('lands above the slow threshold', async () => {
    await sleep(225)
    expect(true).toBe(true)
  })
})
