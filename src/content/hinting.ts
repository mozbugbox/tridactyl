/** Hint links.

    TODO:

    important
        Connect to input system
        Gluing into tridactyl
    unimportant
        Frames
        Redraw on reflow
*/

import * as DOM from "@src/lib/dom"
import { log } from "@src/lib/math"
import {
    permutationsWithReplacement,
    islice,
    izip,
    map,
    unique,
} from "@src/lib/itertools"
import { contentState } from "@src/content/state_content"
import * as config from "@src/lib/config"
import Logger from "@src/lib/logging"
const logger = new Logger("hinting")

/** Calclate the distance between two segments. */
function distance(l1: number, r1: number, l2: number, r2: number): number {
    if (l1 < r2 && r1 > l2) {
        return 0
    } else {
        return Math.min(Math.abs(l1 - r2), Math.abs(l2 - r1))
    }
}

/** Simple container for the state of a single frame's hints. */
class HintState {
    public focusedHint: Hint
    readonly hintHost = document.createElement("div")
    readonly hints: Hint[] = []
    public selectedHints: Hint[] = []
    public filter = ""
    public hintchars = ""

    constructor(
        public filterFunc: HintFilter,
        public resolve: (x) => void,
        public reject: (x) => void,
        public rapid: boolean,
    ) {
        this.hintHost.classList.add("TridactylHintHost", "cleanslate")
    }

    get activeHints() {
        return this.hints.filter(h => !h.flag.hidden)
    }

    /**
     * Remove hinting elements and classes from the DOM
     */
    cleanUpHints() {
        // Undo any alterations of the hinted elements
        for (const hint of this.hints) {
            hint.hidden = true
        }

        // Remove all hints from the DOM.
        this.hintHost.remove()
    }

    resolveHinting() {
        this.cleanUpHints()

        if (this.rapid) this.resolve(this.selectedHints.map(h => h.result))
        else
            this.resolve(
                this.selectedHints[0] ? this.selectedHints[0].result : "",
            )
    }

    changeFocusedHintIndex(offset) {
        const activeHints = this.activeHints
        if (!activeHints.length) {
            return
        }

        // Get the index of the currently focused hint
        const focusedIndex = activeHints.indexOf(this.focusedHint)

        // Unfocus the currently focused hint
        this.focusedHint.focused = false

        // Focus the next hint, accounting for negative wraparound
        const nextFocusedIndex =
            (focusedIndex + offset + activeHints.length) % activeHints.length
        this.focusedHint = activeHints[nextFocusedIndex]
        this.focusedHint.focused = true
    }

    changeFocusedHintTop() {
        const focusedRect = this.focusedHint.rect

        // Get all hints from the top area
        const topHints = this.activeHints.filter(h => h.rect.top < focusedRect.top && h.rect.bottom < focusedRect.bottom)
        if (!topHints.length) {
            return
        }

        // Find the next top hint
        const nextFocusedHint = topHints.reduce((a, b) => {
            const aDistance = distance(a.rect.left, a.rect.right, focusedRect.left, focusedRect.right)
            const bDistance = distance(b.rect.left, b.rect.right, focusedRect.left, focusedRect.right)
            if (aDistance < bDistance) {
                return a
            } else if (aDistance > bDistance) {
                return b
            } else {
                if (a.rect.bottom < b.rect.bottom) {
                    return b
                } else {
                    return a
                }
            }
        })

        // Unfocus the currently focused hint
        this.focusedHint.focused = false

        // Focus the next hint
        this.focusedHint = nextFocusedHint
        this.focusedHint.focused = true
    }

    changeFocusedHintBottom() {
        const focusedRect = this.focusedHint.rect

        // Get all hints from the bottom area
        const bottomHints = this.activeHints.filter(h => h.rect.top > focusedRect.top && h.rect.bottom > focusedRect.bottom)
        if (!bottomHints.length) {
            return
        }

        // Find the next bottom hint
        const nextFocusedHint = bottomHints.reduce((a, b) => {
            const aDistance = distance(a.rect.left, a.rect.right, focusedRect.left, focusedRect.right)
            const bDistance = distance(b.rect.left, b.rect.right, focusedRect.left, focusedRect.right)
            if (aDistance < bDistance) {
                return a
            } else if (aDistance > bDistance) {
                return b
            } else {
                if (a.rect.top > b.rect.top) {
                    return b
                } else {
                    return a
                }
            }
        })

        // Unfocus the currently focused hint
        this.focusedHint.focused = false

        // Focus the next hint
        this.focusedHint = nextFocusedHint
        this.focusedHint.focused = true
    }

    changeFocusedHintLeft() {
        const focusedRect = this.focusedHint.rect

        // Get all hints from the left area
        const leftHints = this.activeHints.filter(h => h.rect.left < focusedRect.left && h.rect.right < focusedRect.right)
        if (!leftHints.length) {
            return
        }

        // Find the next left hint
        const nextFocusedHint = leftHints.reduce((a, b) => {
            const aDistance = distance(a.rect.top, a.rect.bottom, focusedRect.top, focusedRect.bottom)
            const bDistance = distance(b.rect.top, b.rect.bottom, focusedRect.top, focusedRect.bottom)
            if (aDistance < bDistance) {
                return a
            } else if (aDistance > bDistance) {
                return b
            } else {
                if (a.rect.right < b.rect.right) {
                    return b
                } else {
                    return a
                }
            }
        })

        // Unfocus the currently focused hint
        this.focusedHint.focused = false

        // Focus the next hint
        this.focusedHint = nextFocusedHint
        this.focusedHint.focused = true
    }

    changeFocusedHintRight() {
        const focusedRect = this.focusedHint.rect

        // Get all hints from the right area
        const rightHints = this.activeHints.filter(h => h.rect.left > focusedRect.left && h.rect.right > focusedRect.right)
        if (!rightHints.length) {
            return
        }

        // Find the next right hint
        const nextFocusedHint = rightHints.reduce((a, b) => {
            const aDistance = distance(a.rect.top, a.rect.bottom, focusedRect.top, focusedRect.bottom)
            const bDistance = distance(b.rect.top, b.rect.bottom, focusedRect.top, focusedRect.bottom)
            if (aDistance < bDistance) {
                return a
            } else if (aDistance > bDistance) {
                return b
            } else {
                if (a.rect.left > b.rect.left) {
                    return b
                } else {
                    return a
                }
            }
        })

        // Unfocus the currently focused hint
        this.focusedHint.focused = false

        // Focus the next hint
        this.focusedHint = nextFocusedHint
        this.focusedHint.focused = true
    }
}

let modeState: HintState

/** For each hintable element, add a hint */
export function hintPage(
    hintableElements: Element[],
    onSelect: HintSelectedCallback,
    resolve = () => {},
    reject = () => {},
    rapid = false,
) {
    const buildHints: HintBuilder = defaultHintBuilder()
    const filterHints: HintFilter = defaultHintFilter()
    contentState.mode = "hint"
    modeState = new HintState(filterHints, resolve, reject, rapid)

    if (!rapid) {
        buildHints(hintableElements, hint => {
            modeState.cleanUpHints()
            hint.result = onSelect(hint.target)
            modeState.selectedHints.push(hint)
            reset()
        })
    } else {
        buildHints(hintableElements, hint => {
            hint.result = onSelect(hint.target)
            modeState.selectedHints.push(hint)
        })
    }

    if (! modeState.hints.length) {
        // No more hints to display
        reset()
        return
    }

    // There are multiple hints. Normally we would just show all of them, but
    // we try to be clever here. Automatically select the first one if all the
    // conditions are true:
    //  - it is <a>
    //  - its href is not empty (does not point to the page itself)
    //  - its href is not javascript
    //  - all the remaining hints
    //      - are either _not_ <a>
    //      - or their href points to the sampe place as first one

    const firstTarget = modeState.hints[0].target

    const firstTargetIsSelectable = (): boolean => {
        return firstTarget instanceof HTMLAnchorElement &&
            firstTarget.href !== "" &&
            !firstTarget.href.startsWith("javascript:")
    }

    const allTargetsAreEqual = (): boolean => {
        return undefined === modeState.hints.find(h => {
            return (
                !(h.target instanceof HTMLAnchorElement) ||
                h.target.href !== (firstTarget as HTMLAnchorElement).href
            )
        })
    }

    if (modeState.hints.length == 1 ||
        (firstTargetIsSelectable() && allTargetsAreEqual())) {
        // There is just a single link or all the links point to the same
        // place. Select it.
        modeState.cleanUpHints()
        modeState.hints[0].select()
        reset()
        return
    }

    // Just focus first link
    modeState.focusedHint = modeState.hints[0]
    modeState.focusedHint.focused = true
    document.documentElement.appendChild(modeState.hintHost)
}

function defaultHintBuilder() {
    switch (config.get("hintfiltermode")) {
        case "simple":
            return buildHintsSimple
        case "vimperator":
            return buildHintsVimperator
        case "vimperator-reflow":
            return buildHintsVimperator
    }
}

function defaultHintFilter() {
    switch (config.get("hintfiltermode")) {
        case "simple":
            return filterHintsSimple
        case "vimperator":
            return filterHintsVimperator
        case "vimperator-reflow":
            return fstr => filterHintsVimperator(fstr, true)
    }
}

function defaultHintChars() {
    if (config.get("hintnames") === "numeric") {
        return "1234567890"
    }
    return config.get("hintchars")
}

/** An infinite stream of hints

    Earlier hints prefix later hints
*/
function* hintnames_simple(
    hintchars = defaultHintChars(),
): IterableIterator<string> {
    for (let taglen = 1; true; taglen++) {
        yield* map(permutationsWithReplacement(hintchars, taglen), e =>
            e.join(""),
        )
    }
}

/** Shorter hints

    Hints that are prefixes of other hints are a bit annoying because you have to select them with Enter or Space.

    This function removes hints that prefix other hints by observing that:
        let h = hintchars.length
        if n < h ** 2
        then n / h = number of single character hintnames that would prefix later hints

    So it removes them. This function is not yet clever enough to realise that if n > h ** 2 it should remove
        h + (n - h**2 - h) / h ** 2
    and so on, but we hardly ever see that many hints, so whatever.

*/
function* hintnames_short(
    n: number,
    hintchars = defaultHintChars(),
): IterableIterator<string> {
    const source = hintnames_simple(hintchars)
    const num2skip = Math.floor(n / hintchars.length)
    yield* islice(source, num2skip, n + num2skip)
}

/** Uniform length hintnames */
function* hintnames_uniform(
    n: number,
    hintchars = defaultHintChars(),
): IterableIterator<string> {
    if (n <= hintchars.length) yield* islice(hintchars[Symbol.iterator](), n)
    else {
        // else calculate required length of each tag
        const taglen = Math.ceil(log(n, hintchars.length))
        // And return first n permutations
        yield* map(
            islice(permutationsWithReplacement(hintchars, taglen), n),
            perm => {
                return perm.join("")
            },
        )
    }
}

function* hintnames_numeric(n: number): IterableIterator<string> {
    for (let i = 1; i <= n; i++) {
        yield String(i)
    }
}

function* hintnames(
    n: number,
    hintchars = defaultHintChars(),
): IterableIterator<string> {
    switch (config.get("hintnames")) {
        case "numeric":
            yield* hintnames_numeric(n)
        case "uniform":
            yield* hintnames_uniform(n, hintchars)
        default:
            yield* hintnames_short(n, hintchars)
    }
}

type HintSelectedCallback = (x: any) => any

/** Place a flag by each hintworthy element */
class Hint {
    public readonly flag = document.createElement("span")
    public readonly rect: ClientRect = null
    public result: any = null

    constructor(
        public readonly target: Element,
        public readonly name: string,
        public readonly filterData: any,
        private readonly onSelect: HintSelectedCallback,
    ) {
        // We need to compute the offset for elements that are in an iframe
        let offsetTop = 0
        let offsetLeft = 0
        if (target.ownerDocument !== document) {
            const iframe = DOM.getAllDocumentFrames().find(
                frame => frame.contentDocument === target.ownerDocument,
            )
            const rect = iframe.getClientRects()[0]
            offsetTop += rect.top
            offsetLeft += rect.left
        }

        const rect = target.getClientRects()[0]
        this.rect = {
            top: rect.top + offsetTop,
            bottom: rect.bottom + offsetTop,
            left: rect.left + offsetLeft,
            right: rect.right + offsetLeft,
            width: rect.width,
            height: rect.height
        }

        this.flag.textContent = name
        this.flag.className = "TridactylHint"
        if (config.get("hintuppercase") === "true") {
            this.flag.classList.add("TridactylHintUppercase")
        }
        this.flag.classList.add("TridactylHint" + target.tagName)
        this.flag.style.cssText = `
            top: ${window.scrollY + this.rect.top}px !important;
            left: ${window.scrollX + this.rect.left}px !important;
        `
        modeState.hintHost.appendChild(this.flag)
        this.hidden = false
    }

    // These styles would be better with pseudo selectors. Can we do custom ones?
    // If not, do a state machine.
    set hidden(hide: boolean) {
        this.flag.hidden = hide
        if (hide) {
            this.focused = false
            this.target.classList.remove("TridactylHintElem")
        } else {
            this.target.classList.add("TridactylHintElem")
        }
    }

    set focused(focus: boolean) {
        if (focus) {
            this.target.classList.add("TridactylHintActive")
            this.target.classList.remove("TridactylHintElem")
        } else {
            this.target.classList.add("TridactylHintElem")
            this.target.classList.remove("TridactylHintActive")
        }
    }

    select() {
        this.onSelect(this)
    }
}

type HintBuilder = (els: Element[], onSelect: HintSelectedCallback) => void

function buildHintsSimple(els: Element[], onSelect: HintSelectedCallback) {
    const names = hintnames(els.length)
    for (const [el, name] of izip(els, names)) {
        logger.debug({ el, name })
        modeState.hintchars += name
        modeState.hints.push(new Hint(el, name, null, onSelect))
    }
}

function buildHintsVimperator(els: Element[], onSelect: HintSelectedCallback) {
    const names = hintnames(els.length)
    // escape the hintchars string so that strange things don't happen
    // when special characters are used as hintchars (for example, ']')
    const escapedHintChars = defaultHintChars().replace(/^\^|[-\\\]]/g, "\\$&")
    const filterableTextFilter = new RegExp("[" + escapedHintChars + "]", "g")
    for (const [el, name] of izip(els, names)) {
        let ft = elementFilterableText(el)
        // strip out hintchars
        ft = ft.replace(filterableTextFilter, "")
        logger.debug({ el, name, ft })
        modeState.hintchars += name + ft
        modeState.hints.push(new Hint(el, name, ft, onSelect))
    }
}

function elementFilterableText(el: Element): string {
    const nodename = el.nodeName.toLowerCase()
    let text: string
    if (nodename === "input") {
        text = (el as HTMLInputElement).value
    } else if (0 < el.textContent.length) {
        text = el.textContent
    } else if (el.hasAttribute("title")) {
        text = el.getAttribute("title")
    } else {
        text = el.innerHTML
    }
    // Truncate very long text values
    return text.slice(0, 2048).toLowerCase() || ""
}

type HintFilter = (s: string) => void

/** Show only hints prefixed by fstr. Focus first match */
function filterHintsSimple(fstr) {
    const active: Hint[] = []
    let foundMatch
    for (const h of modeState.hints) {
        if (!h.name.startsWith(fstr)) h.hidden = true
        else {
            if (!foundMatch) {
                h.focused = true
                modeState.focusedHint = h
                foundMatch = true
            }
            h.hidden = false
            active.push(h)
        }
    }
    if (active.length === 1) {
        selectFocusedHint()
    }
}

/** Partition the filter string into hintchars and content filter strings.
    Apply each part in sequence, reducing the list of active hints.

    Update display after all filtering, adjusting labels if appropriate.

    Consider: This is a poster child for separating data and display. If they
    weren't so tied here we could do a neat dynamic programming thing and just
    throw the data at a reactalike.
*/
function filterHintsVimperator(fstr, reflow = false) {
    /** Partition a fstr into a tagged array of substrings */
    function partitionFstr(fstr): Array<{ str: string; isHintChar: boolean }> {
        const peek = a => a[a.length - 1]
        const hintChars = defaultHintChars()

        // For each char, either add it to the existing run if there is one and
        // it's a matching type or start a new run
        const runs = []
        for (const char of fstr) {
            const isHintChar = hintChars.includes(char)
            if (!peek(runs) || peek(runs).isHintChar !== isHintChar) {
                runs.push({ str: char, isHintChar })
            } else {
                peek(runs).str += char
            }
        }
        return runs
    }

    function rename(hints) {
        const names = hintnames(hints.length)
        for (const [hint, name] of izip(hints, names)) {
            hint.name = name
        }
    }

    // Start with all hints
    let active = modeState.hints

    // If we're reflowing, the names may be wrong at this point, so apply the original names.
    if (reflow) rename(active)

    // Filter down (renaming as required)
    for (const run of partitionFstr(fstr)) {
        if (run.isHintChar) {
            // Filter by label
            active = active.filter(hint => hint.name.startsWith(run.str))
        } else {
            // By text
            active = active.filter(hint => hint.filterData.includes(run.str))

            if (reflow) rename(active)
        }
    }

    // Update display
    // Unfocus the focused hint - must be before hiding the hint
    if (modeState.focusedHint) {
        modeState.focusedHint.focused = false
        modeState.focusedHint = undefined
    }

    // Set hidden state of the hints
    for (const hint of modeState.hints) {
        if (active.includes(hint)) {
            hint.hidden = false
            hint.flag.textContent = hint.name
        } else {
            hint.hidden = true
        }
    }

    // Focus first hint
    if (active.length) {
        modeState.focusedHint = active[0]
        modeState.focusedHint.focused = true
    }

    // Select focused hint if it's the only match
    if (active.length === 1) {
        selectFocusedHint(true)
    }
}

/** Remove all hints, reset STATE.
 **/
function reset() {
    if (modeState) {
        modeState.cleanUpHints()
        modeState.resolveHinting()
    }
    modeState = undefined
    contentState.mode = "normal"
}

/** If key is in hintchars, add it to filtstr and filter */
function pushKey(ke) {
    if (ke.ctrlKey || ke.altKey || ke.metaKey) {
        // Do nothing
    } else if (ke.key === "Backspace") {
        modeState.filter = modeState.filter.slice(0, -1)
        modeState.filterFunc(modeState.filter)
    } else if (ke.key.length === 1 && modeState.hintchars.includes(ke.key)) {
        // The new key can be used to filter the hints
        const originalFilter = modeState.filter
        modeState.filter += ke.key
        modeState.filterFunc(modeState.filter)

        if (modeState && !modeState.activeHints.length) {
            // There are no more active hints, undo the change to the filter
            modeState.filter = originalFilter
            modeState.filterFunc(modeState.filter)
        }
    }
}

/** Array of hintable elements in viewport

    Elements are hintable if
        1. they can be meaningfully selected, clicked, etc
        2. they're visible
            1. Within viewport
            2. Not hidden by another element
*/
export function hintables(selectors = DOM.HINTTAGS_selectors, withjs = false) {
    let elems = DOM.getElemsBySelector(selectors, [])
    if (withjs) {
        elems = elems.concat(DOM.hintworthy_js_elems)
        elems = unique(elems)
    }
    return elems.filter(DOM.isVisible)
}

/** Returns elements that point to a saveable resource
 */
export function saveableElements() {
    return DOM.getElemsBySelector(DOM.HINTTAGS_saveable, [DOM.isVisible])
}

/** Get array of images in the viewport
 */
export function hintableImages() {
    return DOM.getElemsBySelector(DOM.HINTTAGS_img_selectors, [DOM.isVisible])
}

export function hintByText(match) {
    return DOM.getElemsBySelector(DOM.HINTTAGS_filter_by_text_selectors, [
        DOM.isVisible,
        hint => {
            let text
            if (hint instanceof HTMLInputElement) {
                // tslint:disable-next-line:no-useless-cast
                text = (hint as HTMLInputElement).value
            } else {
                text = hint.textContent
            }
            return text.indexOf(match) >= 0
        },
    ])
}

/** Array of items that can be killed with hint kill
 */
export function killables() {
    return DOM.getElemsBySelector(DOM.HINTTAGS_killable_selectors, [
        DOM.isVisible,
    ])
}

export function pipe(
    selectors = DOM.HINTTAGS_selectors,
    action: HintSelectedCallback = _ => _,
    rapid = false,
    jshints = true,
): Promise<[Element, number]> {
    return new Promise((resolve, reject) => {
        hintPage(hintables(selectors, jshints), action, resolve, reject, rapid)
    })
}

export function pipe_elements(
    elements: any = DOM.elementsWithText,
    action: HintSelectedCallback = _ => _,
    rapid = false,
): Promise<[Element, number]> {
    return new Promise((resolve, reject) => {
        hintPage(elements, action, resolve, reject, rapid)
    })
}

function selectFocusedHint(delay = false) {
    logger.debug("Selecting hint.", contentState.mode)
    const focused = modeState.focusedHint
    const selectFocusedHintInternal = () => {
        modeState.filter = ""
        modeState.hints.forEach(h => (h.hidden = false))
        focused.select()
    }
    if (delay) setTimeout(selectFocusedHintInternal, config.get("hintdelay"))
    else selectFocusedHintInternal()
}

function focusNextHint() {
    logger.debug("Focusing next hint")
    modeState.changeFocusedHintIndex(1)
}

function focusPreviousHint() {
    logger.debug("Focusing previous hint")
    modeState.changeFocusedHintIndex(-1)
}

function focusTopHint() {
    logger.debug("Focusing top hint")
    modeState.changeFocusedHintTop()
}

function focusBottomHint() {
    logger.debug("Focusing bottom hint")
    modeState.changeFocusedHintBottom()
}

function focusLeftHint() {
    logger.debug("Focusing left hint")
    modeState.changeFocusedHintLeft()
}

function focusRightHint() {
    logger.debug("Focusing right hint")
    modeState.changeFocusedHintRight()
}

export function parser(keys: KeyboardEvent[]) {
    for (const keyev of keys) {
        const key = keyev.key
        switch (key) {
            case "Escape":
                reset()
                break
            case "Tab":
                if (keyev.shiftKey) {
                    focusPreviousHint()
                } else {
                    focusNextHint()
                }
                break
            case "ArrowUp":
                focusTopHint()
                break
            case "ArrowDown":
                focusBottomHint()
                break
            case "ArrowLeft":
                focusLeftHint()
                break
            case "ArrowRight":
                focusRightHint()
                break
            case "Enter":
            case " ":
                selectFocusedHint()
                break
            default:
                pushKey(keys[0])
        }
    }
    return { keys: [], ex_str: "", isMatch: true }
}
