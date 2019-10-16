const bindings = () => {
    const inputEl = document.querySelector('.js-subscribe-input');
    const defaultCopy = inputEl.value;

    inputEl.addEventListener('focus', () => {
        if (inputEl.value === defaultCopy) {
            inputEl.value = '';
        }

        inputEl.classList.add('is-focused');
    });

    inputEl.addEventListener('blur', () => {
        if (inputEl.value === '') {
            inputEl.value = defaultCopy;
        }

        if (inputEl.value === defaultCopy) {
            inputEl.classList.remove('is-focused');
        }
    });
}

const displayMessageAfterTracks = () => {
    const isUnsubscribed = hasEmailParams();
    let playCount = 0;

    if (isUnsubscribed) {
        mediator.subscribe('play', () => {
            playCount++;

            if (playCount === 5) {
                document.querySelector('.js-subscribe').click();
            }
        });
    }
}

const hasEmailParams = () => {
    const string = window.location.search;

    if (string) {
        const params = string.replace('?', '').split('&');
        const values = new Object;

        params.forEach(param => {
            param = param.split('=');
            values[param[0]] = param[1];
        });

        if (values.utm_source && values.utm_source === 'newsletter') {
            return false;
        }
    }

    return true;
}

export default {
    init: () => {
        bindings();
        displayMessageAfterTracks();
    }
}