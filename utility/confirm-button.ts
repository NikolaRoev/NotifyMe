/**
 * Modifies a button to require a second click, done in a specified timeframe to execute any other `click` listeners.
 * 
 * @param button An existing button element.
 * @param confirmText The contents of the button's HTML during the confirm state.
 * @param delay Time in milliseconds to wait in the confirm state before reverting to the initial state. Default is `1500` ms.
 */
export function makeConfirmButton(button: HTMLElement, confirmText: string, delay = 1500) {
    const initialText = button.innerHTML;
    button.dataset.utilTriggered = "no";

    button.addEventListener("click", (event) => {
        if (button.dataset.utilTriggered === "no") {
            event.stopImmediatePropagation();

            button.innerHTML = confirmText;
            button.dataset.utilTriggered = "yes";
            setTimeout(() => {
                button.dataset.utilTriggered = "no";
                button.innerHTML = initialText;
            }, delay);
        }
    });
}
