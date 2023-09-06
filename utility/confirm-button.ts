/**
 * Modifies a button to require a second click, done in a specified timeframe,
 * to execute the `onclick` function.
 * 
 * @param button An existing button element.
 * @param func The function to be executed on click.
 * @param confirmText The contents of the button's HTML during the confirm state.
 * @param delay Time in milliseconds to wait in the confirm state before reverting to the initial state. Default is `1500`.
 */
export function createConfirmButton(button: HTMLButtonElement, func: () => void, confirmText: string, delay = 1500) {
    const initialText = button.innerHTML;
    button.dataset.implementationTriggered = "no";

    button.addEventListener("click", () => {
        if (button.dataset.implementationTriggered === "no") {
            button.innerHTML = confirmText;
            button.dataset.implementationTriggered = "yes";
            setTimeout(() => {
                button.dataset.implementationTriggered = "no";
                button.innerHTML = initialText;
            }, delay);
        }
        else if (button.dataset.implementationTriggered === "yes") {
            func();
        }
    });
}
