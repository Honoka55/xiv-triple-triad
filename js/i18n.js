const i18n = {
    data: {},
    currentLanguage: '',
    setData(data) {
        this.data = data;
    },
    setLanguage(language) {
        document.querySelector('html').setAttribute('lang', language);
        this.currentLanguage = language;
    },
    getText(key) {
        return this.data[this.currentLanguage][key];
    },
    translate() {
        let elements = document.querySelectorAll('[data-i18n]');
        elements.forEach((element) => {
            let key = element.getAttribute('data-i18n');
            element.innerHTML = this.getText(key);
        });
    },
    detectLanguage() {
        let language = navigator.language;
        if (!this.data[language]) {
            //如果语言不存在就用默认的语言
            language = 'zh';
        }
        document.getElementById('language-select').value = language;
        this.setLanguage(language);
        this.translate();
    }
};

// 调用
fetch('/xiv-triple-triad/data/i18n.json')
    .then((response) => response.json())
    .then((data) => {
        i18n.setData(data);
        i18n.detectLanguage();
    });
