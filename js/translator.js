/**
 * 翻译服务类
 * @class Translator
 */
class Translator {
  constructor() {
    /**
     * 百度翻译API配置
     * @type {Object}
     */
    this.config = {
      fromLang: 'auto',
      toLang: 'en',
      appId: '20250116002254368',  // 您的百度翻译AppID
      secretKey: 'c7FlX_XvAv8orcrXL02O', // 您的密钥
      salt: new Date().getTime(),
      apiUrl: 'https://api.fanyi.baidu.com/api/trans/vip/translate'
    };

    // 添加翻译历史记录存储
    this.history = [];
    this.maxHistoryItems = 10;

    // 初始化
    this.bindEvents();
    this.initErrorToast();
    this.loadHistory();
  }

  /**
   * 初始化错误提示组件
   * @private
   */
  initErrorToast() {
    const toastHtml = `
      <div id="errorToast" class="error-toast hidden">
        <span class="error-message"></span>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    this.errorToast = document.getElementById('errorToast');
  }

  /**
   * 生成翻译API签名
   * @param {string} text - 待翻译文本
   * @returns {string} 签名
   * @private
   */
  generateSign(text) {
    // 百度翻译API签名算法: appid + q + salt + 密钥
    const str = this.config.appId + text + this.config.salt + this.config.secretKey;
    return this.md5(str);
  }

  /**
   * MD5加密
   * @param {string} string - 待加密字符串
   * @returns {string} MD5加密结果
   * @private 
   */
  md5(string) {
    return CryptoJS.MD5(string).toString();
  }

  /**
   * 翻译文本
   * @param {string} text - 需要翻译的文本
   * @returns {Promise<string>} 翻译结果
   * @public
   */
  async translateText(text) {
    try {
      const sign = this.generateSign(text);
      const params = new URLSearchParams({
        q: text,
        from: this.config.fromLang,
        to: this.config.toLang,
        appid: this.config.appId,
        salt: this.config.salt,
        sign: sign
      });

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        throw new Error('网络请求失败');
      }

      const result = await response.json();
      
      if (result.error_code) {
        throw new Error(result.error_msg || '翻译失败');
      }

      const translatedText = result.trans_result[0].dst;
      this.updateTranslationPanel(text, translatedText);
      return translatedText;

    } catch (error) {
      this.showError(error.message || '翻译服务暂时不可用');
      return '';
    }
  }

  /**
   * 更新翻译面板内容
   * @param {string} originalText - 原文
   * @param {string} translatedText - 译文
   * @private
   */
  updateTranslationPanel(originalText, translatedText) {
    const panel = document.getElementById('translationPanel');
    const originalTextDiv = panel.querySelector('.original-text');
    const translatedTextDiv = panel.querySelector('.translated-text');

    originalTextDiv.textContent = originalText;
    translatedTextDiv.textContent = translatedText;

    panel.classList.remove('hidden');
  }

  /**
   * 显示错误信息
   * @param {string} message - 错误信息
   * @private
   */
  showError(message) {
    const messageSpan = this.errorToast.querySelector('.error-message');
    messageSpan.textContent = message;
    
    this.errorToast.classList.remove('hidden');
    setTimeout(() => {
      this.errorToast.classList.add('hidden');
    }, 3000);
  }

  /**
   * 绑定翻译相关的事件
   * @private
   */
  bindEvents() {
    // 监听悬浮球点击事件
    const floatingBall = document.getElementById('floatingBall');
    floatingBall?.addEventListener('click', () => this.toggleTranslationPanel());

    // 监听关闭按钮
    const closeBtn = document.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => this.hideTranslationPanel());

    // 监听文本选择事件
    document.addEventListener('mouseup', (e) => this.handleTextSelection(e));

    // 添加语言切换事件
    document.getElementById('languageSelect')?.addEventListener('change', (e) => {
      this.switchLanguage(e.target.value);
    });
  }

  /**
   * 切换翻译面板显示状态
   * @private
   */
  toggleTranslationPanel() {
    const panel = document.getElementById('translationPanel');
    panel.classList.toggle('hidden');
  }

  /**
   * 隐藏翻译面板
   * @private
   */
  hideTranslationPanel() {
    const panel = document.getElementById('translationPanel');
    panel.classList.add('hidden');
  }

  /**
   * 处理文本选择事件
   * @param {MouseEvent} event - 鼠标事件对象
   * @private
   */
  handleTextSelection(event) {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      this.translateText(selectedText);
    }
  }

  /**
   * 初始化翻译面板
   * @private
   */
  initTranslationPanel() {
    const panelHtml = `
      <div id="translationPanel" class="translation-panel hidden">
        <div class="panel-header">
          <div class="language-switch">
            <select id="languageSelect">
              <option value="en">英语</option>
              <option value="zh">中文</option>
            </select>
          </div>
          <button class="close-btn">×</button>
        </div>
        <div class="translation-content">
          <div class="original-text"></div>
          <div class="translated-text"></div>
        </div>
        <div class="history-section">
          <h3>翻译历史</h3>
          <ul id="historyList" class="history-list"></ul>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', panelHtml);
  }

  /**
   * 加载历史记录
   * @private
   */
  loadHistory() {
    const savedHistory = localStorage.getItem('translationHistory');
    if (savedHistory) {
      this.history = JSON.parse(savedHistory);
      this.updateHistoryUI();
    }
  }

  /**
   * 保存历史记录
   * @private
   */
  saveHistory() {
    localStorage.setItem('translationHistory', JSON.stringify(this.history));
  }

  /**
   * 添加翻译记录
   * @param {Object} record - 翻译记录
   * @private
   */
  addToHistory(record) {
    this.history.unshift(record);
    if (this.history.length > this.maxHistoryItems) {
      this.history.pop();
    }
    this.saveHistory();
    this.updateHistoryUI();
  }

  /**
   * 更新历史记录UI
   * @private
   */
  updateHistoryUI() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;

    historyList.innerHTML = this.history.map(item => `
      <li class="history-item">
        <div class="history-original">${item.original}</div>
        <div class="history-translated">${item.translated}</div>
      </li>
    `).join('');
  }

  /**
   * 切换语言
   * @param {string} targetLang - 目标语言
   * @private
   */
  switchLanguage(targetLang) {
    this.config.toLang = targetLang;
    // 如果当前有文本，重新翻译
    const originalText = document.querySelector('.original-text')?.textContent;
    if (originalText) {
      this.translateText(originalText);
    }
  }
}

// 创建翻译器实例
const translator = new Translator();

// 导出翻译器实例
export default translator; 