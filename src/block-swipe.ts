/**
 * Prevents the mobile browser behaviour that moves to the next or previous page
 * in your browser's history when you swipe in from the edge of the screen.
 *
 * Only seems to work reliably on Safari. Testing on Chrome iOS showed
 * inconsistent effectiveness. Did not test other browsers.
 *
 * @returns A function to call to resume the browser's normal behaviour.
 */
export function preventBrowserHistorySwipeGestures() {
    function touchStart(ev: TouchEvent) {
        if (ev.touches.length === 1) {
            const touch = ev.touches[0];
            if (
                touch.clientX < window.innerWidth * 0.1 ||
                touch.clientX > window.innerWidth * 0.9
            ) {
                ev.preventDefault();
            }
        }
    }

    // Safari defaults to passive: true for the touchstart event, so we need  to explicitly specify false
    // See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
    const options= { passive: false };

    window.addEventListener("touchstart", touchStart, options);
    // @ts-ignore
    return () => window.removeEventListener("touchstart", touchStart, options);
}