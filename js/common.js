// 1. Firebase SDKをインポート (common.jsはモジュールとして読み込まれるため)
// ★ NEW: 外部ファイルから設定を読み込む
import { firebaseConfig } from './project-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";



// 3. Firebase初期化 (appとdbをこのファイル内で定義)
// ★ NEW: グローバルにアクセス可能にするため、windowに紐づける
window.app = initializeApp(firebaseConfig);
window.db = getFirestore(window.app);
// 認証機能もグローバル化（admin.htmlが使用するため）
window.auth = getAuth(window.app);

// 4. DOM読み込み完了時の処理
document.addEventListener('DOMContentLoaded', () => {
  // 4a. ハンバーガーメニュー機能 (index.htmlから移転)
  setupHamburgerMenu();

  // ★ NEW: profile.html のコンテンツロードを有効化 (Phase 8-5)
  if (document.getElementById('articles-grid')) {
    setupInfoPageLogic();
  }
  // ★ NEW: profile.html のコンテンツロードを有効化 (Phase 8-5)
  // profile.htmlのDOM要素が存在する場合にのみ実行されます。
  if (document.getElementById('timeline-container')) {
    loadPublicTimeline();
    loadPublicSkills();
    loadPublicContactInfo();
  }


  // 4b. ヘッダー/フッターの動的コンテンツ読み込み
  loadHeaderNavigation();
  loadHeaderCta();
  loadProfileCta(); // NEW: profile.html のCTAを読み込む
  loadTopBooks(); // Phase 8-8: トップページのおすすめ書籍を読み込む


  loadBottomNavigation(); // Phase 6-3

  // ★ blog.html のロジック ★
  if (document.getElementById('blog-list-container')) {
    loadCategoriesToSelect(); // Phase 7-5: カテゴリー選択肢の読み込み
    loadBlogList();
  }
  // NEW: blog-detail.html のロジックを有効化 (Phase 9-1)
  if (window.location.pathname.includes('blog-detail.html')) {
    loadArticleDetail(); // ★ 修正: この関数は動的コンテンツも読み込むように後で修正します
  }

  // ★ NEW: media.html のコンテンツロードを有効化 (Phase 8-4)
  // media.htmlのDOM要素が存在する場合にのみ実行されます。
  if (document.getElementById('books-container')) {
    loadPublicBooks();
    loadPublicMediaIcons();
    loadPublicMediaBanners();
    loadPublicSites();
  }
  // ★ NEW: profile.html のパーソナル情報読み込み (Phase 10-1)
  if (document.getElementById('personal-container')) {
    loadPublicPersonalInfo();
  }

  // ★ NEW: Phase 8-8 index.html のトップ書籍を読み込む
  loadTopBooks();

  // お問い合わせセットの読み込み (Contact Sets)
  if (typeof loadActiveContactSet === 'function') {
    loadActiveContactSet();
  } else {
    console.warn('loadActiveContactSet function is not defined.');
  }

  loadCustomHtmlParts(); // カスタムHTML部品の読み込み
  loadGlobalFooter(); // 共通フッターの読み込み
  loadSiteBranding();

  // ★ スニペットプレビューボタンのイベント設定
  // ★ スニペットプレビューボタンのイベント設定（修正版）
  const openPreviewBtn = document.getElementById('open-preview-tab-btn');
  if (openPreviewBtn) {
    openPreviewBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // 1. 今まさに画面のテキストエリアに入っているコードを取得
      const codeArea = document.getElementById("snippet-code-area");
      const currentCode = codeArea ? codeArea.value : '';

      if (!currentCode) {
        alert("プレビューするコードがありません。");
        return;
      }

      // 2. 保存して開く
      localStorage.setItem('snippetPreviewCode', currentCode);
      window.open('preview.html', '_blank');
    });
  } // サイトタイトル・ロゴの読み込み
});

/**
 * ハンバーガーメニュー（三本線）のクリックイベントを設定
 */
function setupHamburgerMenu() {
  const toggleButton = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (toggleButton && mobileMenu) {
    toggleButton.addEventListener('click', () => {
      // 'hidden' クラスをトグル（付け外し）する
      mobileMenu.classList.toggle('hidden');

      // アイコンを 'menu' と 'close' で切り替える
      const icon = toggleButton.querySelector('.material-symbols-outlined');
      if (icon) {
        if (mobileMenu.classList.contains('hidden')) {
          icon.textContent = 'menu';
        } else {
          icon.textContent = 'close';
        }
      }
    });
  }
}

/**
 * Firebase (navigation) からメニュー項目を読み込み、ヘッダーに挿入
 */
async function loadHeaderNavigation() {
  const navPC = document.getElementById('main-nav');
  const navMobile = document.getElementById('mobile-nav');

  // ローダーを非表示にする (読み込み成否に関わらず)
  const loaderPC = document.getElementById('main-nav-loader');
  const loaderMobile = document.getElementById('mobile-nav-loader');

  try {
    const navCol = collection(db, 'navigation');
    const q = query(navCol, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("メニュー項目がありません");
    }

    // PC用とスマホ用のHTMLを生成
    let htmlPC = '';
    let htmlMobile = '';

    querySnapshot.forEach((docSnap) => {
      const item = docSnap.data();
      // PC用
      htmlPC += `
        <a class="text-sm font-medium hover:text-primary dark:hover:text-secondary transition-colors" href="${item.url}">
          ${item.title}
        </a>
      `;
      // スマホ用
      htmlMobile += `
        <a class="block px-3 py-2 rounded-md text-base font-medium hover:bg-slate-100 dark:hover:bg-slate-700" href="${item.url}">
          ${item.title}
        </a>
      `;
    });

    // HTMLを挿入
    if (navPC) navPC.innerHTML = htmlPC;
    if (navMobile) navMobile.innerHTML = htmlMobile;

  } catch (error) {
    console.error("ナビゲーションの読み込みエラー:", error);
    if (navPC) navPC.innerHTML = '<p class="text-sm text-red-500">メニュー読込失敗</p>';
    if (navMobile) navMobile.innerHTML = '<p class="p-4 text-red-500">メニュー読込失敗</p>';
  } finally {
    // ローダーを削除 (innerHTMLで上書きされるが、念のため)
    if (loaderPC) loaderPC.remove();
    if (loaderMobile) loaderMobile.remove();
  }
}

/**
 * Firebase (staticPages/commonSettings) からヘッダーCTAボタン設定を読み込み、挿入
 */
async function loadHeaderCta() {
  const ctaContainerPC = document.getElementById('header-cta-container');
  const ctaContainerMobile = document.getElementById('mobile-cta-container');

  try {
    const docRef = doc(db, "staticPages", "commonSettings");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().headerCta) {
      const ctaData = docSnap.data().headerCta;

      // visible が false または true (undefinedではない) かチェック
      if (ctaData.visible === true) {
        // ボタンを表示
        const ctaHtmlPC = `
          <a href="${ctaData.url || '#'}" role="button" class="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold tracking-[0.015em] hover:opacity-90 transition-opacity flex-shrink-0">
            <span class="truncate">${ctaData.text || '詳細'}</span>
          </a>
        `;
        const ctaHtmlMobile = `
          <a href="${ctaData.url || '#'}" role="button" class="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold tracking-[0.015em] hover:opacity-90 transition-opacity flex-shrink-0">
            <span class="truncate">${ctaData.text || '詳細'}</span>
          </a>
        `;

        if (ctaContainerPC) ctaContainerPC.innerHTML = ctaHtmlPC;
        if (ctaContainerMobile) ctaContainerMobile.innerHTML = ctaHtmlMobile;

      } else {
        // visible が false の場合
        if (ctaContainerPC) ctaContainerPC.innerHTML = ''; // 非表示 (ローダーを消す)
        if (ctaContainerMobile) ctaContainerMobile.innerHTML = ''; // 非表示 (ローダーを消す)
      }
    } else {
      // データがまだない場合
      throw new Error("CTA設定が見つかりません");
    }
  } catch (error) {
    console.error("ヘッダーCTAの読み込みエラー:", error);
    // エラー時または設定がない時は、ボタンを非表示 (ローダーを消す)
    if (ctaContainerPC) ctaContainerPC.innerHTML = '';
    if (ctaContainerMobile) ctaContainerMobile.innerHTML = '';
  }
}

/**
 * Firebase (bottomNavigation) からボトムナビ項目を読み込み、フッターに挿入 (Phase 6-3)
 */
async function loadBottomNavigation() {
  const navContainer = document.getElementById('bottom-nav-container');

  if (!navContainer) return;

  try {
    // Firestore の collection, query, orderBy が import 済みであることを利用
    const bottomNavCol = collection(db, 'bottomNavigation');
    const q = query(bottomNavCol, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      document.getElementById('bottom-nav').classList.add('hidden'); // nav要素自体を非表示
      return;
    }

    let html = '';
    querySnapshot.forEach((docSnap) => {
      const item = docSnap.data();

      // アイコン表示の分岐
      let iconDisplayHtml = '';
      if (item.customIconUrl) {
        // 画像がある場合は画像を表示
        iconDisplayHtml = `<img src="${item.customIconUrl}" alt="${item.title}" class="w-6 h-6 object-contain">`;
      } else {
        // ない場合はMaterial Symbolsを表示 (iconNameを使用)
        iconDisplayHtml = `<span class="material-symbols-outlined text-2xl">${item.iconName || 'link'}</span>`;
      }

      html += `
        <a href="${item.url}" class="flex flex-col items-center justify-center p-2 text-primary dark:text-secondary hover:text-text-muted-light dark:hover:text-text-muted-dark transition-colors w-full">
          ${iconDisplayHtml}
          <span class="text-xs mt-1 truncate max-w-full">${item.title}</span>
        </a>
      `;
    });

    // HTMLを挿入
    navContainer.innerHTML = html;
    const bottomNavEl = document.getElementById('bottom-nav'); // ボトムナビ要素の取得

    if (bottomNavEl) {
      // 既存の非表示クラスをすべて削除し、常時表示を強制
      bottomNavEl.classList.remove('hidden', 'md:hidden', 'lg:hidden');
      // 追尾型フッターに必要なクラスを再確認（fixed bottom-0 z-40）
      bottomNavEl.classList.add('fixed', 'bottom-0', 'z-50'); // z-indexは既存の50を維持
    }

  } catch (error) {
    console.error("ボトムナビの読み込みエラー:", error);
    navContainer.innerHTML = '<p class="text-sm text-red-500 p-2">メニュー読込失敗</p>';
  }
}

/**
 * Firebase (blogCategories) からカテゴリーを読み込み、ドロップダウンに挿入 (Phase 7-5)
 */
async function loadCategoriesToSelect() {
  const select = document.getElementById('category-select');
  if (!select) return;

  try {
    const categoriesCol = collection(db, 'blogCategories');
    // カテゴリー名 (name) でソート
    const q = query(categoriesCol, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);

    // 既存の「カテゴリー選択」オプションを残し、それ以外をクリア
    select.innerHTML = '<option value="">カテゴリー選択</option>';

    querySnapshot.forEach((docSnap) => {
      const category = docSnap.data();
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = category.name;
      select.appendChild(option);
    });

  } catch (error) {
    console.error("カテゴリードロップダウンの読み込みエラー:", error);
    select.innerHTML = '<option value="">読込エラー</option>';
  }
}

/**
 * ブログ詳細ページがロードされたとき、外部URL/内部URLへのリダイレクトをチェックする (Phase 7-6)
 */
async function checkArticleRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id'); // URLから記事IDを取得

  // blog-detail.html でかつ ID がなければ何もしない
  if (!window.location.pathname.includes('blog-detail.html') || !articleId) {
    return;
  }

  try {
    const docRef = doc(db, 'blogPosts', articleId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const item = docSnap.data();

      // MODIFIED: URLが存在し、スラッシュで始まらない有効なリンク（http/httpsまたはxxx.html）であればリダイレクトを実行
      // スラッシュで始まる場合（例: /admin）は内部コンテンツ表示の将来的な予約としてリダイレクトしない
      const shouldRedirect = item.url && !item.url.startsWith('/');

      if (shouldRedirect) {
        // 新しいタブで開く設定がされていれば、それを尊重
        if (item.openNewTab) {
          window.open(item.url, '_blank');
          // 元のタブはブログ一覧に戻す（ユーザー体験を考慮）
          window.location.href = 'blog.html';
        } else {
          // 同じタブでリダイレクト
          window.location.href = item.url;
        }
        return;
      }

      // ★ TODO: 将来的に内部記事本文を表示するロジックをここに実装 ★

      // リダイレクトされなかった場合（将来の内部記事本文表示用。現状ではサイトルートへのリンク（/）のみ）
      document.getElementById('article-title').textContent = item.title;
      document.getElementById('article-content').innerHTML = `<p class="text-lg text-red-500">記事のURLが指定されていないか、サイトルートへのリンクです。現在のページはデモ用です。</p>`;

    } else {
      document.getElementById('article-title').textContent = '記事が見つかりません';
      document.getElementById('article-content').innerHTML = '<p>指定された記事IDは無効です。</p>';
    }

  } catch (error) {
    console.error("記事詳細の読み込みエラー:", error);
    document.getElementById('article-content').innerHTML = '<p class="text-red-500">記事の読み込み中にエラーが発生しました。</p>';
  }
}

/**
 * Firebase (blogs) からブログ記事一覧を読み込み、blog.htmlに挿入 (Phase 7-4/7-5)
 */
async function loadBlogList(newSortOrder, searchQuery = '', categoryFilter = '') {
  const container = document.getElementById('blog-list-container');
  const sortDateButton = document.getElementById('sort-date-button');
  const searchInput = document.getElementById('search-input');

  if (!container) return; // blog.html 以外のページでは何もしない

  // 1. ソート順の決定
  let currentOrder = sortDateButton ? sortDateButton.dataset.sortOrder || 'desc' : 'desc';
  if (newSortOrder) {
    currentOrder = newSortOrder;
  }

  // ロード中のフィードバック
  container.innerHTML = '<p class="text-center text-text-muted-light dark:text-text-muted-dark p-8">記事を読み込み中...</p>';

  try {
    // --- 1. データの並列取得 ---
    const staticPostsPromise = getDocs(query(collection(db, 'blogPosts')));
    const dynamicPostsPromise = getDocs(query(collection(db, 'blogContents'), orderBy('timestamp', 'desc')));

    const [staticSnapshot, dynamicSnapshot] = await Promise.all([staticPostsPromise, dynamicPostsPromise]);

    // --- 2. データの統合と整形 ---
    let allItems = [];

    // 静的記事 (blogPosts)
    staticSnapshot.forEach(docSnap => {
      const item = docSnap.data();
      allItems.push({
        id: docSnap.id,
        title: item.title,
        imageUrl: item.imageUrl,
        category: item.category,
        date: item.createdAt, // ソート用の統一キー
        description: item.description,
        linkUrl: item.url || `blog-detail.html?id=${docSnap.id}`,
        isDynamic: false,
        openNewTab: item.openNewTab || false,
        order: item.order || 0
      });
    });

    // 動的記事 (blogContents)
    dynamicSnapshot.forEach(docSnap => {
      const item = docSnap.data();
      // contentBlocksから概要を生成
      let descriptionText = '';
      if (Array.isArray(item.contentBlocks) && item.contentBlocks.length > 0) {
        descriptionText = item.contentBlocks.join(' ').replace(/<[^>]*>?/gm, '').substring(0, 100);
      }

      allItems.push({
        id: docSnap.id,
        title: item.title,
        imageUrl: item.imageUrl,
        category: 'ブログ', // 動的記事のデフォルトカテゴリ
        date: item.timestamp, // ソート用の統一キー
        description: descriptionText,
        linkUrl: `blog-detail.html?id=${docSnap.id}`, // 常に詳細ページへ
        isDynamic: true,
        openNewTab: false, // 動的記事は常に同じタブで開く
        order: 0 // 動的記事は常に日付順
      });
    });

    // --- 3. フィルタリングとソート ---
    const queryText = searchQuery.toLowerCase().trim();
    let filteredItems = allItems.filter(item => {
      const searchTarget = `${item.title || ''} ${item.category || ''} ${item.description || ''}`.toLowerCase();
      const matchesKeyword = (queryText === '' || searchTarget.includes(queryText));
      const matchesCategory = (categoryFilter === '' || item.category === categoryFilter);
      return matchesKeyword && matchesCategory;
    });

    // ソート実行
    filteredItems.sort((a, b) => {
      // orderが0より大きいものは優先的に先頭へ
      if (a.order > 0 || b.order > 0) {
        if (a.order !== b.order) return b.order - a.order;
      }
      // orderが同じか0の場合は日付で比較
      const dateA = a.date?.toMillis() || 0;
      const dateB = b.date?.toMillis() || 0;
      return currentOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    if (filteredItems.length === 0) {
      container.innerHTML = `<p class="text-lg text-text-muted-light dark:text-text-muted-dark p-8">${queryText || categoryFilter ? `条件に一致する記事は見つかりませんでした。` : 'まだ公開されている記事がありません。'}</p>`;
      return;
    }

    // --- 4. HTML生成 ---
    let html = '';
    filteredItems.forEach((item) => {
      const dateStr = item.date ? new Date(item.date.seconds * 1000).toLocaleDateString('ja-JP') : '日付不明';
      const newTabTarget = item.openNewTab ? 'target="_blank" rel="noopener noreferrer"' : '';

      html += `
        <div class="blog-card group flex flex-col md:flex-row gap-0 md:gap-6 rounded-xl bg-surface-light dark:bg-surface-dark overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-border-light dark:border-border-dark" data-article-id="${item.id}">
          
          <div class="w-full md:w-5/12 overflow-hidden flex-shrink-0">
            <img src="${item.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="${item.title || '記事画像'}" class="w-full h-full aspect-video md:aspect-auto object-cover group-hover:scale-[1.03] transition-transform duration-500">
          </div>
          
          <div class="flex flex-col gap-3 px-5 pb-5 pt-4 md:p-6 w-full md:w-7/12">
            <p class="text-sm font-normal text-subtext-light dark:text-subtext-dark">${dateStr} | <span class="font-semibold text-primary">${item.category || 'カテゴリなし'}</span></p>
            
            <a href="${item.linkUrl}" ${newTabTarget} class="text-xl font-bold leading-normal group-hover:text-primary transition-colors hover:underline">
              ${item.title || 'タイトルなし'}
            </a>
            
            <p class="text-sm text-text-muted-light dark:text-text-muted-dark leading-relaxed line-clamp-3">
              ${formatText(item.description || '')}
            </p>
            
            <a href="${item.linkUrl}" ${newTabTarget} class="text-sm font-medium leading-normal text-primary dark:text-secondary hover:underline mt-auto flex items-center gap-1">
              続きを読む <span class="material-symbols-outlined !text-base align-middle transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
            </a>
          </div>
        </div>
      `;
    });

    // --- 5. HTML挿入とUI更新 ---
    container.innerHTML = html;

    // 5. ボタンの表示とイベントリスナーの追加
    if (sortDateButton) { // sortDateButton が存在する場合のみ処理
      const categorySelect = document.getElementById('category-select'); // categorySelectを取得

      // クラスのアクティブ状態を制御
      sortDateButton.classList.remove('bg-slate-100', 'dark:bg-slate-700');
      sortDateButton.classList.add('bg-primary/20', 'text-primary');

      // ボタンのテキストを設定
      sortDateButton.textContent = currentOrder === 'desc' ? '日付: 新しい順' : '日付: 古い順';

      // 現在のソート順をデータ属性に保存
      sortDateButton.dataset.sortOrder = currentOrder;

      // イベントリスナーを一度だけ設定
      if (!sortDateButton.hasAttribute('data-listener-set')) {
        sortDateButton.addEventListener('click', () => {
          const latestOrder = sortDateButton.dataset.sortOrder;
          const nextOrder = latestOrder === 'desc' ? 'asc' : 'desc';
          // 次の並び順と、現在の検索クエリとカテゴリフィルタで再読み込み
          loadBlogList(nextOrder, searchInput.value, categorySelect.value);
        });
        sortDateButton.setAttribute('data-listener-set', 'true');
      }
    }

  } catch (error) {
    console.error("ブログ記事一覧の読み込みエラー:", error);
    container.innerHTML = '<p class="text-sm text-red-500 p-4">記事一覧の読み込み中にエラーが発生しました。</p>';
  }
}

/**
 * ブログ記事詳細ページのコンテンツを読み込む (Phase 9-3)
 * 動的コンテンツ(blogContents)と静的コンテンツ(blogPosts)の両方に対応
 */
async function loadArticleDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');

  const titleEl = document.getElementById('article-title');
  const dateEl = document.getElementById('article-date');
  const categoryEl = document.getElementById('article-category');
  const imageEl = document.getElementById('article-image');
  const bodyEl = document.getElementById('article-body');

  if (!titleEl || !bodyEl) return; // 必要な要素がなければ終了

  if (!articleId) {
    titleEl.textContent = '記事IDが指定されていません';
    bodyEl.innerHTML = '<p>URLに "?id=..." を付けて記事IDを指定してください。</p>';
    return;
  }

  try {
    // 1. まず blogContents (動的記事) から検索
    const docRef = doc(db, 'blogContents', articleId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // --- 動的記事が見つかった場合 ---
      const item = docSnap.data();
      titleEl.textContent = item.title || 'タイトルなし';

      if (item.timestamp?.toDate) {
        const dateObj = item.timestamp.toDate();
        dateEl.textContent = new Date(dateObj).toLocaleDateString('ja-JP');
      }
      categoryEl.textContent = 'ブログ'; // 動的記事はカテゴリ固定

      if (item.imageUrl) {
        imageEl.src = item.imageUrl;
        imageEl.alt = item.title || 'アイキャッチ画像';
        imageEl.style.display = 'block';
      } else {
        imageEl.style.display = 'none';
      }

      // ★ 配列 (contentBlocks) を連結して表示 ★
      if (Array.isArray(item.contentBlocks) && item.contentBlocks.length > 0) {
        const fullHtmlContent = item.contentBlocks.join('');
        bodyEl.innerHTML = fullHtmlContent;
      } else if (item.content) {
        // 後方互換性: 古い形式 (content) があればそれを表示
        bodyEl.innerHTML = item.content;
      } else {
        bodyEl.innerHTML = '<p class="text-lg text-text-muted-light dark:text-text-muted-dark">この記事には本文がありません。</p>';
      }

    } else {
      // 3. blogContents になければ、静的記事 (blogPosts) からフォールバック検索
      const staticDocRef = doc(db, 'blogPosts', articleId);
      const staticDocSnap = await getDoc(staticDocRef);

      if (staticDocSnap.exists()) {
        // --- 静的記事が見つかった場合 ---
        const staticItem = staticDocSnap.data();

        // 外部リンクならリダイレクト
        const shouldRedirect = staticItem.url && !staticItem.url.startsWith('/');
        if (shouldRedirect) {
          if (staticItem.openNewTab) {
            window.open(staticItem.url, '_blank');
            window.location.href = 'blog.html'; // 元のタブは戻す
          } else {
            window.location.href = staticItem.url;
          }
          return;
        }

        // 内部表示用 (タイトル等のみ)
        titleEl.textContent = staticItem.title || 'タイトルなし';
        if (staticItem.createdAt?.toDate) {
          const dateObj = staticItem.createdAt.toDate();
          dateEl.textContent = new Date(dateObj).toLocaleDateString('ja-JP');
        }
        categoryEl.textContent = staticItem.category || '未分類';

        if (staticItem.imageUrl) {
          imageEl.src = staticItem.imageUrl;
          imageEl.alt = staticItem.title;
          imageEl.style.display = 'block';
        } else {
          imageEl.style.display = 'none';
        }

        bodyEl.innerHTML = `<p class="text-lg">${formatText(staticItem.description || '')}</p><p class="mt-4 text-sm text-text-muted-light">※この記事は概要のみです。</p>`;

      } else {
        // どちらにもない場合
        titleEl.textContent = '記事が見つかりません';
        bodyEl.innerHTML = '<p>指定された記事IDは、動的記事または静的記事のどちらにも見つかりませんでした。</p>';
      }
    }
  } catch (error) {
    console.error("記事詳細の読み込みエラー:", error);
    if (bodyEl) bodyEl.innerHTML = '<p class="text-red-500">記事の読み込み中にエラーが発生しました。</p>';
  }
}

// NEW: 検索入力時のイベントハンドラ (Phase 7-4)
// blog.htmlから直接呼び出されるため、windowに追加してグローバルにする
window.handleSearch = function () {
  const searchInput = document.getElementById('search-input');
  const sortDateButton = document.getElementById('sort-date-button');
  const categorySelect = document.getElementById('category-select');

  // 現在のソート順を取得
  const currentOrder = sortDateButton ? sortDateButton.dataset.sortOrder || 'desc' : 'desc';

  // 入力されたテキストで記事一覧を再読み込み
  loadBlogList(currentOrder, searchInput.value, categorySelect.value);
}

// NEW: カテゴリー選択時のイベントハンドラ (Phase 7-5)
window.handleCategoryChange = function () {
  const searchInput = document.getElementById('search-input');
  const sortDateButton = document.getElementById('sort-date-button');
  const categorySelect = document.getElementById('category-select');

  // 現在のソート順を取得
  const currentOrder = sortDateButton ? sortDateButton.dataset.sortOrder || 'desc' : 'desc';

  // 選択されたカテゴリーと、現在の検索クエリで記事一覧を再読み込み
  loadBlogList(currentOrder, searchInput.value, categorySelect.value);
}

export function generateBookSnippet(books) {
  let html = `<div id="top-books-container" class="grid grid-cols-1 lg:grid-cols-2 gap-8">`;

  books.forEach((docSnap) => {
    // docSnapがFirestoreのDocumentSnapshotか、生のオブジェクトかを判定
    const book = docSnap.data ? docSnap.data() : docSnap;

    const linkHref = book.url || "#";
    const targetBlank = (book.openNewTab === true) ? 'target="_blank" rel="noopener noreferrer"' : "";
    const btnText = book.buttonText || "詳細を見る";

    html += `
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6 rounded-lg bg-card-light dark:bg-card-dark p-6 shadow-md transition-shadow hover:shadow-xl">
        <div class="w-48 md:w-56 flex-shrink-0">
          <img alt="Book cover of ${book.title}" class="rounded-lg shadow-xl w-full h-auto object-cover aspect-[3/4]" src="${book.imageUrl}" onerror="this.src='https://placehold.co/300x400/cccccc/ffffff?text=Image+Not+Found'; this.onerror=null;">
        </div>
        <div class="flex flex-col gap-4 text-center md:text-left">
          <div class="flex flex-col gap-1">
            <p class="text-text-light dark:text-text-dark text-xl font-bold leading-tight">${book.title}</p>
            <p class="text-text-muted-light dark:text-text-muted-dark text-sm font-normal leading-normal">${book.description}</p>
          </div>
          <a class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105 mx-auto md:mx-0 w-fit" href="${linkHref}" ${targetBlank}>
            <span class="truncate">${btnText}</span>
            <span class="material-symbols-outlined ml-2 text-base">arrow_forward</span>
          </a>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

export function generateSingleBookSnippet(book) {
  const linkHref = book.url || "#";
  const targetBlank = (book.openNewTab === true) ? 'target="_blank" rel="noopener noreferrer"' : "";
  const btnText = book.buttonText || "詳細を見る";

  // starRating が存在しない場合は5をデフォルトとする
  const rating = book.starRating || 5;
  const starHtml = Array(rating).fill('<span class="material-symbols-outlined text-yellow-500 !text-base">star</span>').join('');

  return `
<div class="book-snippet-card flex flex-col items-center gap-4 rounded-lg bg-surface-light dark:bg-surface-dark p-6 shadow-xl w-72 mx-auto">
    <div class="w-40 flex-shrink-0">
        <img alt="Book cover of ${book.title}" class="rounded-lg shadow-xl w-full h-auto object-cover aspect-[3/4]" src="${book.imageUrl}" onerror="this.src='https://placehold.co/300x400/cccccc/ffffff?text=No+Cover'; this.onerror=null;">
    </div>
    <div class="flex flex-col gap-2 text-center">
        <div class="flex items-center justify-center">${starHtml}</div>
        <p class="text-text-light dark:text-text-dark text-lg font-bold leading-tight">${book.title}</p>
        <p class="text-text-muted-light dark:text-text-muted-dark text-xs font-normal leading-normal line-clamp-3">${book.description}</p>
        <a class="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 px-4 bg-primary text-white text-xs font-bold tracking-[0.015em] transition-transform hover:scale-105 w-fit mx-auto" href="${linkHref}" ${targetBlank}>
            <span class="truncate">${btnText}</span>
            <span class="material-symbols-outlined ml-1 text-base">arrow_forward</span>
        </a>
    </div>
</div>
`;
}

/**
 * スニペットモーダルを表示する関数
 * @param {string} code - 表示するHTMLコード
 */
export function showSnippetModal(code) {
  const snippetModal = document.getElementById("snippet-modal");
  const snippetCodeArea = document.getElementById("snippet-code-area");
  const copyMessage = document.getElementById("copy-message");

  if (snippetModal && snippetCodeArea) {
    // 1. コードエリアに表示
    snippetCodeArea.value = code;

    // 2. モーダルを表示
    if (copyMessage) copyMessage.classList.add('hidden');
    snippetModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
}
// グローバルスコープにも登録（admin.htmlからの呼び出し用）
window.showSnippetModal = showSnippetModal;

// --- 1. Firestoreから書籍を読み込む (media.htmlから移植) ---
async function loadPublicBooks() {
  const booksContainer = document.getElementById("books-container");
  const booksLoader = document.getElementById("books-loader");
  if (!booksContainer || !booksLoader) return;
  booksLoader.classList.remove("hidden");
  try {
    const booksCol = collection(db, "books");
    // 修正: メディアページ固定がONのものだけを、指定の表示順で取得
    const q = query(booksCol, where("fixedOnMedia", "==", true), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);

    booksLoader.classList.add("hidden");
    booksContainer.innerHTML = ""; // ローダーを消す

    if (querySnapshot.empty) {
      booksContainer.innerHTML =
        '<p class="text-center text-text-muted-light dark:text-text-muted-dark">現在、紹介する書籍はありません。</p>';
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const book = docSnap.data();
      const bookEl = document.createElement("div");
      bookEl.className =
        "flex flex-col md:flex-row items-center md:items-start gap-6 rounded-lg bg-card-light dark:bg-card-dark p-6 shadow-md transition-shadow hover:shadow-xl";
      const linkHref = book.url || "#";
      const targetBlank = (book.url && book.openNewTab)
        ? 'target="_blank" rel="noopener noreferrer"'
        : "";

      bookEl.innerHTML = `
        <div class="w-48 md:w-56 flex-shrink-0">
          <img alt="Book cover of ${book.title}" class="rounded-lg shadow-xl w-full h-auto object-cover aspect-[3/4]" src="${book.imageUrl}" onerror="this.src='https://placehold.co/300x400/cccccc/ffffff?text=Image+Not+Found'; this.onerror=null;">
        </div>
        <div class="flex flex-col gap-4 text-center md:text-left">
          <div class="flex flex-col gap-1">
            <p class="text-text-light dark:text-text-dark text-xl font-bold leading-tight">${book.title}</p>
            <p class="text-text-muted-light dark:text-text-muted-dark text-sm font-normal leading-normal">${book.description}</p>
          </div>
          <a class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105 mx-auto md:mx-0 w-fit" href="${linkHref}" ${targetBlank}>
            <span class="truncate">${book.buttonText || '詳細を見る'}</span>
            <span class="material-symbols-outlined ml-2 text-base">arrow_forward</span>
          </a>
        </div>
      `;
      booksContainer.appendChild(bookEl);
    });
  } catch (error) {
    console.error("Error loading books: ", error);
    booksLoader.classList.add("hidden");
    booksContainer.innerHTML =
      '<p class="text-center text-red-500">書籍の読み込みに失敗しました。</p>';
  }
}

// --- 2. Firestoreからメディア(アイコン)を読み込む (media.htmlから移植) ---
async function loadPublicMediaIcons() {
  const mediaIconsContainer = document.getElementById("media-icons-container");
  const mediaIconsLoader = document.getElementById("media-icons-loader");
  if (!mediaIconsContainer || !mediaIconsLoader) return;
  mediaIconsLoader.classList.remove("hidden");
  try {
    const mediaIconsCol = collection(db, "mediaIcons");
    const q = query(mediaIconsCol, orderBy("order", "asc")); // 表示順でソート
    const querySnapshot = await getDocs(q);

    mediaIconsLoader.classList.add("hidden");
    mediaIconsContainer.innerHTML = ""; // ローダーを消す

    if (querySnapshot.empty) {
      mediaIconsContainer.innerHTML =
        '<p class="text-center text-text-muted-light dark:text-text-muted-dark col-span-full">現在、紹介するメディアはありません。</p>';
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const iconData = docSnap.data();
      const iconEl = document.createElement("a");
      iconEl.className =
        "flex flex-1 gap-3 rounded-lg border border-primary/20 bg-card-light dark:bg-card-dark p-4 flex-col justify-center items-center text-center transition-transform hover:-translate-y-1 hover:shadow-lg";
      iconEl.href = iconData.url || "#";
      if (iconData.url) {
        iconEl.target = "_blank";
        iconEl.rel = "noopener noreferrer";
      }

      let iconHtml = "";
      if (iconData.customIconUrl) {
        // カスタム画像が設定されている場合
        iconHtml = `<img src="${iconData.customIconUrl}" alt="${iconData.title}" class="w-8 h-8 object-contain">`;
      } else {
        // リストからアイコン名が選ばれている場合
        iconHtml = `<span class="material-symbols-outlined text-3xl text-primary dark:text-accent">${iconData.iconName || "link"
          }</span>`;
      }

      iconEl.innerHTML = `
        ${iconHtml}
        <div class="flex flex-col">
          <h3 class="text-text-light dark:text-text-dark text-base font-bold leading-tight">${iconData.title}</h3>
          <p class="text-text-muted-light dark:text-text-muted-dark text-xs font-normal leading-normal">${iconData.description}</p>
        </div>
      `;
      mediaIconsContainer.appendChild(iconEl);
    });
  } catch (error) {
    console.error("Error loading media icons: ", error);
    mediaIconsLoader.classList.add("hidden");
    mediaIconsContainer.innerHTML =
      '<p class="text-center text-red-500 col-span-full">メディア(アイコン)の読み込みに失敗しました。</p>';
  }
}

// --- 3. Firestoreからメディア(バナー)を読み込む (media.htmlから移植) ---
async function loadPublicMediaBanners() {
  const mediaBannersContainer = document.getElementById(
    "media-banners-container"
  );
  const mediaBannersLoader = document.getElementById("media-banners-loader");
  if (!mediaBannersContainer || !mediaBannersLoader) return;
  mediaBannersLoader.classList.remove("hidden");
  try {
    const mediaBannersCol = collection(db, "mediaBanners");
    const q = query(mediaBannersCol, orderBy("order", "asc")); // 表示順でソート
    const querySnapshot = await getDocs(q);

    mediaBannersLoader.classList.add("hidden");
    mediaBannersContainer.innerHTML = ""; // ローダーを消す

    if (querySnapshot.empty) {
      mediaBannersContainer.innerHTML =
        '<p class="text-center text-text-muted-light dark:text-text-muted-dark col-span-full">現在、紹介するバナーはありません。</p>';
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const bannerData = docSnap.data();
      const bannerEl = document.createElement("a");

      // アニメーションクラスを決定
      const animClass =
        {
          pulse: "animate-pulse",
          wiggle: "animate-wiggle",
          squish: "animate-squish",
          flash: "animate-flash",
          heartbeat: "animate-heartbeat",
        }[bannerData.animation] || ""; // 'none' または未定義は空文字

      bannerEl.className = `relative block w-full aspect-[3/2] rounded-xl overflow-hidden group ${animClass}`;
      bannerEl.href = bannerData.url || "#";
      if (bannerData.url) {
        bannerEl.target = "_blank";
        bannerEl.rel = "noopener noreferrer";
      }

      bannerEl.innerHTML = `
        <img class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
             alt="Banner image" 
             src="${bannerData.imageUrl}" 
             onerror="this.src='https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found'; this.onerror=null;">
        <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="text-white text-lg font-bold">情報をチェック</span>
        </div>
      `;
      mediaBannersContainer.appendChild(bannerEl);
    });
  } catch (error) {
    console.error("Error loading media banners: ", error);
    mediaBannersLoader.classList.add("hidden");
    mediaBannersContainer.innerHTML =
      '<p class="text-center text-red-500 col-span-full">メディア(バナー)の読み込みに失敗しました。</p>';
  }
}

// --- 4. Firestoreからブログ・HPを読み込む (media.htmlから移植) ---
async function loadPublicSites() {
  const sitesContainer = document.getElementById("sites-container");
  const sitesLoader = document.getElementById("sites-loader");
  if (!sitesContainer || !sitesLoader) return;
  sitesLoader.classList.remove("hidden");
  try {
    const sitesCol = collection(db, "sites");
    const q = query(sitesCol, orderBy("order", "asc")); // 表示順でソート
    const querySnapshot = await getDocs(q);

    sitesLoader.classList.add("hidden");
    sitesContainer.innerHTML = ""; // ローダーを消す

    if (querySnapshot.empty) {
      sitesContainer.innerHTML =
        '<p class="text-center text-text-muted-light dark:text-text-muted-dark col-span-full">現在、紹介するブログ・HPはありません。</p>';
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const siteData = docSnap.data();
      const siteEl = document.createElement("div");
      siteEl.className =
        "flex flex-col items-stretch justify-between gap-4 rounded-lg bg-card-light dark:bg-card-dark p-6 shadow-md transition-shadow hover:shadow-xl";

      let iconHtml = "";
      if (siteData.customIconUrl) {
        // カスタム画像
        iconHtml = `<img src="${siteData.customIconUrl}" alt="${siteData.title}" class="w-12 h-12 object-contain rounded-lg">`;
      } else {
        // リストから選択
        iconHtml = `<div class="w-12 h-12 bg-primary/20 dark:bg-primary/20 rounded-lg flex items-center justify-center">
                      <span class="material-symbols-outlined text-primary dark:text-accent text-3xl">${siteData.iconName || "hub"
          }</span>
                    </div>`;
      }

      siteEl.innerHTML = `
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-4">
            ${iconHtml}
            <p class="text-text-light dark:text-text-dark text-lg font-bold leading-tight">${siteData.title
        }</p>
          </div>
          <p class="text-text-muted-light dark:text-text-muted-dark text-sm font-normal leading-normal">${siteData.description
        }</p>
        </div>
        <a class="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-accent-secondary text-white text-sm font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105 w-fit self-start" 
           href="${siteData.url || "#"}" 
           ${siteData.url ? 'target="_blank" rel="noopener noreferrer"' : ""}>
          <span class="truncate">公式サイトへ</span>
          <span class="material-symbols-outlined ml-2 text-base">open_in_new</span>
        </a>
      `;
      sitesContainer.appendChild(siteEl);
    });
  } catch (error) {
    console.error("Error loading sites: ", error);
    sitesLoader.classList.add("hidden");
    sitesContainer.innerHTML =
      '<p class="text-center text-red-500 col-span-full">ブログ・HPの読み込みに失敗しました。</p>';
  }
}

// --- 5. Firestoreから経歴 (Timeline) を読み込む (profile.html用) ---
async function loadPublicTimeline() {
  const container = document.getElementById("timeline-container");
  const loader = document.getElementById("timeline-loader");
  if (!container || !loader) return;
  loader.classList.remove("hidden");
  container.innerHTML = ''; // コンテナをクリア

  try {
    const timelineCol = collection(db, 'timeline');
    const q = query(timelineCol, orderBy('year', 'desc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = '<p class="text-text-muted-light dark:text-text-muted-dark">経歴情報はありません。</p>';
    } else {
      querySnapshot.forEach(docSnap => {
        const item = docSnap.data();
        const itemEl = document.createElement("div");
        itemEl.className = "relative";
        // 既存のHTML構造を維持
        itemEl.innerHTML = `
          <div class="absolute -left-[41px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary">
              <div class="h-2 w-2 rounded-full bg-white"></div>
          </div>
          <p class="text-sm font-semibold text-secondary mb-1">${item.year}</p>
          <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">${item.title}</h3>
          <p class="text-md text-text-muted-light dark:text-text-muted-dark mb-2">${item.company}</p>
          <p class="text-sm leading-relaxed text-text-light dark:text-text-dark">${formatText(item.description)}</p>
      `;
        container.appendChild(itemEl);
      });
    }
  } catch (error) {
    console.error("経歴の読み込みエラー:", error);
    container.innerHTML = '<p class="text-red-500">経歴の読み込み中にエラーが発生しました。</p>';
  } finally {
    loader.classList.add("hidden"); // ローダーを非表示
  }
}

// --- 6. Firestoreからスキル・資格を読み込む (profile.html用) ---
async function loadPublicSkills() {
  const container = document.getElementById("skills-container");
  const loader = document.getElementById("skills-loader");
  if (!container || !loader) return;
  loader.classList.remove("hidden");
  container.innerHTML = ''; // コンテナをクリア

  try {
    const skillsCol = collection(db, 'skills');
    const q = query(skillsCol, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = '<p class="text-text-muted-light dark:text-text-muted-dark col-span-full">スキル情報はありません。</p>';
    } else {
      querySnapshot.forEach(docSnap => {
        const item = docSnap.data();
        const itemEl = document.createElement("div");
        itemEl.className = "flex flex-col items-center justify-center text-center p-4 md:p-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg transition-transform hover:scale-105 hover:shadow-lg col-span-2 md:col-span-1";

        // アイコン表示ロジックの変更
        let iconHtml = '';
        if (item.customIconUrl) {
          // カスタム画像がある場合
          iconHtml = `<img src="${item.customIconUrl}" alt="${item.title}" class="w-12 h-12 object-contain mb-2">`;
        } else {
          // ない場合はMaterial Symbols
          iconHtml = `<span class="material-symbols-outlined text-4xl text-secondary mb-2">${item.icon || 'code'}</span>`;
        }

        itemEl.innerHTML = `
          ${iconHtml}
          <h4 class="font-bold text-sm md:text-base text-gray-800 dark:text-gray-100">${item.title}</h4>
          <p class="text-xs text-text-muted-light dark:text-text-muted-dark">${formatText(item.subtitle)}</p>
      `;
        container.appendChild(itemEl);
      });
    }
  } catch (error) {
    console.error("スキルの読み込みエラー:", error);
    container.innerHTML = '<p class="text-red-500 col-span-full">スキルの読み込み中にエラーが発生しました。</p>';
  } finally {
    loader.classList.add("hidden"); // ローダーを非表示
  }
}

/**
 * info.html専用の動的ロジック（お知らせ一覧表示、フィルター、モーダル）を設定
 */
function setupInfoPageLogic() {
  // --- グローバル変数 ---
  let allArticles = []; // Firebaseから読み込んだ全記事を保持する配列
  const articlesGrid = document.getElementById('articles-grid');
  const articlesLoaderPublic = document.getElementById('articles-loader-public');
  const filterButtonsContainer = document.getElementById('filter-buttons-container');
  const modal = document.getElementById('article-modal');
  const modalContentWrapper = document.getElementById('modal-content-wrapper');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalMeta = document.getElementById('modal-meta');
  const modalImage = document.getElementById('modal-image');
  const modalBody = document.getElementById('modal-body');

  if (!articlesGrid) return; // info.html以外のページでは実行しない

  // --- 記事を指定された配列に基づいて描画する ---
  function renderArticles(articlesToDisplay) {
    articlesGrid.innerHTML = ''; // グリッドをクリア

    if (articlesToDisplay.length === 0) {
      articlesGrid.innerHTML = '<p class="col-span-1 sm:col-span-2 lg:col-span-3 text-center text-text-muted-light dark:text-text-muted-dark">該当するお知らせはありません。</p>';
      return;
    }

    articlesToDisplay.forEach((article) => {
      const articleEl = document.createElement('div'); // <a> から <div> に変更 (モーダルを開くため)
      articleEl.className = "article-card group flex flex-col gap-4 rounded-xl bg-surface-light dark:bg-surface-dark overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-border-light dark:border-border-dark cursor-pointer"; // cursor-pointer を追加
      articleEl.dataset.articleId = article.id; // クリック時に記事を特定するためのID

      let imageHtml = '';
      if (article.imageUrl) {
        imageHtml = `<img src="${article.imageUrl}" alt="${article.title || '記事画像'}" class="w-full aspect-video object-cover pointer-events-none">`; // pointer-events-none を追加
      } else {
        imageHtml = `<div class="w-full aspect-video bg-slate-200 dark:bg-slate-700 flex items-center justify-center pointer-events-none">
          <span class="material-symbols-outlined text-4xl text-text-muted-light">image_not_supported</span>
        </div>`;
      }

      // 日付のフォーマット (YYYY.MM.DD)
      let articleDateStr = '日付不明';

      if (article.date) {
        try {
          const dateObj = new Date(article.date);
          dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
          const year = dateObj.getFullYear();
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const day = dateObj.getDate().toString().padStart(2, '0');
          articleDateStr = `${year}.${month}.${day}`;
        } catch (e) { console.warn("Date format error:", e); }
      } else if (article.createdAt?.toDate) {
        try {
          const dateObj = article.createdAt.toDate();
          const year = dateObj.getFullYear();
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const day = dateObj.getDate().toString().padStart(2, '0');
          articleDateStr = `${year}.${month}.${day}`;
        } catch (e) { console.warn("Timestamp format error:", e); }
      }

      articleEl.innerHTML = `
        ${imageHtml}
        <div class="flex flex-col gap-2 px-5 pb-5 pointer-events-none">
          <p class="text-sm font-normal text-subtext-light dark:text-subtext-dark">${articleDateStr} | <span class="font-semibold text-primary">${article.category || 'カテゴリなし'}</span></p>
          <p class="text-base font-bold leading-normal group-hover:text-primary transition-colors">${article.title || 'タイトルなし'}</p>
        </div>
      `;
      articlesGrid.appendChild(articleEl);
    });
  }

  // --- モーダル表示機能 ---
  function openModal(article) {
    // 日付のフォーマット (再掲 - openModal内でも必要)
    let articleDateStr = '日付不明';
    if (article.date) {
      try {
        const dateObj = new Date(article.date);
        dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        articleDateStr = `${year}.${month}.${day}`;
      } catch (e) { console.warn("Date format error:", e); }
    } else if (article.createdAt?.toDate) {
      try {
        const dateObj = article.createdAt.toDate();
        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        articleDateStr = `${year}.${month}.${day}`;
      } catch (e) { console.warn("Timestamp format error:", e); }
    }

    modalTitle.textContent = article.title || 'タイトルなし';
    modalMeta.textContent = `${articleDateStr} | ${article.category || 'カテゴリなし'}`;

    if (article.imageUrl) {
      modalImage.src = article.imageUrl;
      modalImage.alt = article.title || '記事画像';
      modalImage.classList.remove('hidden');
    } else {
      modalImage.classList.add('hidden');
    }

    modalBody.textContent = article.content || '本文はありません。'; // textContentで安全に表示

    // モーダルを表示（アニメーションのためクラスを段階的に適用）
    document.body.classList.add('modal-open'); // 背景スクロール固定
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modalContentWrapper.classList.remove('scale-95', 'opacity-0');
    }, 10); // 少し遅延させてアニメーションを開始
  }

  function closeModal() {
    // モーダルを非表示（アニメーションのためクラスを段階的に適用）
    modal.classList.add('opacity-0');
    modalContentWrapper.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open'); // 背景スクロール固定解除
      // モーダル内容をクリア（次回表示のため）
      modalTitle.textContent = '';
      modalMeta.textContent = '';
      modalImage.src = '';
      modalImage.alt = '';
      modalImage.classList.add('hidden');
      modalBody.textContent = '';
    }, 300); // アニメーション時間に合わせて遅延
  }

  // --- Firestoreからカテゴリーボタンを読み込む ---
  async function loadCategoryButtons() {
    filterButtonsContainer.innerHTML = ''; // コンテナをクリア

    try {
      // 1. 「すべて」ボタンを作成 (固定・アクティブ)
      const allBtn = document.createElement('button');
      allBtn.dataset.category = 'すべて';
      allBtn.className = 'filter-btn flex h-9 shrink-0 items-center justify-center rounded-lg px-4 bg-primary/20 dark:bg-primary/20 text-primary text-sm font-bold';
      allBtn.textContent = 'すべて';
      filterButtonsContainer.appendChild(allBtn);

      // 2. Firestoreからカテゴリーを取得
      const catsCol = collection(db, 'articleCategories');
      const q = query(catsCol, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);

      // 3. カテゴリーボタンを作成
      querySnapshot.forEach(docSnap => {
        const cat = docSnap.data();
        const btn = document.createElement('button');
        btn.dataset.category = cat.name;
        // 非アクティブなスタイル
        btn.className = 'filter-btn flex h-9 shrink-0 items-center justify-center rounded-lg px-4 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-light dark:text-text-dark text-sm font-medium';
        btn.textContent = cat.name;
        filterButtonsContainer.appendChild(btn);
      });

    } catch (error) {
      console.error("カテゴリーボタンの読み込みエラー:", error);
    }
  }

  // --- Firestoreから記事を読み込む (getFirestore/collectionなどは common.jsの先頭で定義済み) ---
  async function loadPublicArticles() {
    // スピナーを表示
    articlesGrid.innerHTML = '';
    articlesLoaderPublic.classList.remove('hidden');
    articlesGrid.appendChild(articlesLoaderPublic);

    try {
      // 'createdAt' フィールドの降順 (新しい順) でソート
      const articlesCol = collection(db, 'articles'); // db は common.jsの先頭で定義済み
      const q = query(articlesCol, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      articlesLoaderPublic.classList.add('hidden'); // スピナーを隠す

      if (querySnapshot.empty) {
        articlesGrid.innerHTML = '<p class="col-span-1 sm:col-span-2 lg:col-span-3 text-center text-text-muted-light dark:text-text-muted-dark">お知らせはまだありません。</p>';
        return;
      }

      // 取得した記事データを allArticles 配列に保存
      allArticles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      renderArticles(allArticles); // 初期表示（全記事）

    } catch (error) {
      console.error("Error loading articles: ", error);
      articlesLoaderPublic.classList.add('hidden');
      articlesGrid.innerHTML = `<p class="col-span-1 sm:col-span-2 lg:col-span-3 text-center text-red-500">お知らせの読み込みに失敗しました。管理者に連絡してください。</p>`;
    }
  }

  // --- イベントリスナーの設定 ---

  // 1. カテゴリーフィルター機能
  filterButtonsContainer.addEventListener('click', (e) => {
    const targetButton = e.target.closest('.filter-btn');
    if (!targetButton) return;

    const selectedCategory = targetButton.dataset.category;

    // クリックされたボタンのアクティブ状態を更新
    const allButtons = filterButtonsContainer.querySelectorAll('.filter-btn');
    allButtons.forEach(btn => {
      btn.classList.remove('bg-primary/20', 'dark:bg-primary/20', 'text-primary', 'font-bold');
      btn.classList.add('bg-transparent', 'hover:bg-black/5', 'dark:hover:bg-white/5', 'text-text-light', 'dark:text-text-dark', 'font-medium');
    });
    targetButton.classList.add('bg-primary/20', 'dark:bg-primary/20', 'text-primary', 'font-bold');
    targetButton.classList.remove('bg-transparent', 'hover:bg-black/5', 'dark:hover:bg-white/5', 'text-text-light', 'dark:text-text-dark', 'font-medium');


    // 記事をフィルタリングして再描画
    if (selectedCategory === 'すべて') {
      renderArticles(allArticles);
    } else {
      const filteredArticles = allArticles.filter(article => article.category === selectedCategory);
      renderArticles(filteredArticles);
    }
  });

  // 2. モーダル表示機能
  articlesGrid.addEventListener('click', (e) => {
    const articleCard = e.target.closest('.article-card');
    if (!articleCard) return;

    const articleId = articleCard.dataset.articleId;
    const articleData = allArticles.find(article => article.id === articleId);

    if (articleData) {
      openModal(articleData);
    } else {
      console.error('Article data not found for ID:', articleId);
    }
  });

  // 3. 閉じるボタンと背景クリックでモーダルを閉じる
  modalCloseBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    // 背景（modal自体）がクリックされた場合のみ閉じる
    if (e.target === modal) {
      closeModal();
    }
  });

  // 4. Escキーでモーダルを閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // 5. ページ読み込み時にカテゴリーと記事を取得
  loadCategoryButtons();
  loadPublicArticles();
}

/**
 * Firestore (personalInfo) からパーソナル情報を読み込み、profile.htmlに挿入
 */
async function loadPublicPersonalInfo() {
  const container = document.getElementById('personal-container');
  if (!container) return;

  container.innerHTML = '<p class="text-center text-text-muted-light dark:text-text-muted-dark">情報を読み込み中...</p>';

  try {
    const infoCol = collection(db, 'personalInfo');
    const q = query(infoCol, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = '<p class="text-text-muted-light dark:text-text-muted-dark">パーソナル情報はありません。</p>';
      return;
    }

    let html = '';
    querySnapshot.forEach(docSnap => {
      const item = docSnap.data();
      html += `
        <div class="border-b border-slate-200 dark:border-slate-700 py-4">
          <p class="font-bold text-lg">${item.title || ''}</p>
          <p class="text-text-muted-light dark:text-text-muted-dark mt-2">${formatText(item.description || '')}</p>
        </div>
      `;
    });
    container.innerHTML = html;

  } catch (error) {
    console.error("パーソナル情報の読み込みエラー:", error);
    container.innerHTML = '<p class="text-red-500">情報の読み込み中にエラーが発生しました。</p>';
  }
}

/**
 * Firestore (staticPages) から指定されたページのコンテンツ配列を読み込み、動的に描画する
 * @param {string} pageName - 読み込むページ名 (例: 'contact')
 */
async function renderFixedPageContent(pageName) {
  const container = document.getElementById('contact-info-container'); // 描画先のコンテナ
  if (!container) return;

  container.innerHTML = '<p class="text-center text-text-muted-light dark:text-text-muted-dark p-4">情報を読み込み中...</p>';

  try {
    // 1. staticPagesからコンテンツ配列を取得
    const pageDocRef = doc(db, 'staticPages', pageName);
    const pageDocSnap = await getDoc(pageDocRef);

    if (!pageDocSnap.exists() || !pageDocSnap.data().content || pageDocSnap.data().content.length === 0) {
      container.innerHTML = ''; // コンテンツがない場合は何も表示しない
      return;
    }

    const contentBlocks = pageDocSnap.data().content;
    let html = '';

    // 2. 配列をループしてHTMLを生成
    for (const block of contentBlocks) {
      if (block.type === 'spacer') {
        // [A] スペーサーブロックの場合
        const width = block.width || 'w-full';
        const height = block.height || 'h-8';

        // alignはFlexコンテナで制御するため、div自体には適用しない。mx-autoは中央寄せの際の補助
        html += `<div class="${width} ${height} mx-auto"></div>`;

      } else if (block.type === 'contactInfo' && block.itemId) { // itemIdは、それが参照している contactInfo のドキュメントID
        // [B] お問い合わせ情報ブロックの場合
        const infoDocRef = doc(db, 'contactInfo', block.itemId); // block.itemIdから情報を取得
        const infoDocSnap = await getDoc(infoDocRef);

        if (infoDocSnap.exists()) {
          const item = infoDocSnap.data();
          // 保存されたレイアウト設定
          const width = block.width || 'w-full';
          const alignClass = block.align || 'justify-start';

          let iconHtml = '';
          if (item.customIconUrl) {
            iconHtml = `<img src="${item.customIconUrl}" alt="${item.title}" class="w-8 h-8 object-contain mt-1">`;
          } else {
            iconHtml = `<span class="material-symbols-outlined text-2xl text-primary mt-1">${item.icon || 'info'}</span>`;
          }

          // item.descriptionにformatTextを適用
          const formattedDescription = formatText(item.description || '');

          // 描画される要素
          html += `
            <div class="${width} flex ${alignClass}">
              <div class="flex items-start gap-3 p-4 bg-surface-light dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-md">
                <div class="flex-shrink-0">${iconHtml}</div>
                <div class="flex-1">
                  <p class="font-bold text-base text-text-light dark:text-text-dark">${item.title || ''}</p>
                  <p class="text-sm text-text-muted-light dark:text-text-muted-dark whitespace-pre-wrap">${formattedDescription}</p>
                </div>
              </div>
            </div>
          `;
        }
      }
    }

    // 3. 全体をFlexコンテナで囲んで挿入
    container.innerHTML = `<div class="flex flex-wrap gap-4">${html}</div>`;

  } catch (error) {
    console.error(`固定ページコンテンツ(${pageName})の読み込みエラー:`, error);
    container.innerHTML = '<p class="text-red-500">情報の読み込み中にエラーが発生しました。</p>';
  }
}

/**
 * Phase 8-8: index.html にトップ固定書籍を読み込む
 */
async function loadTopBooks() {
  const topBooksContainer = document.getElementById("top-books-container");
  const topBooksLoader = document.getElementById("top-books-loader");

  // index.html 以外のページ（=受け皿IDが無いページ）では何もしない
  if (!topBooksContainer || !topBooksLoader) {
    return;
  }

  topBooksLoader.classList.remove("hidden");

  try {
    const booksCol = collection(db, "books");
    // 「固定表示」がオンで、「表示順」で並び替え
    const q = query(
      booksCol,
      where("fixed", "==", true),
      orderBy("order", "asc")
    );
    const querySnapshot = await getDocs(q);

    // ローダーを先に消去（コンテナを空にするため）
    topBooksLoader.classList.add("hidden");
    topBooksContainer.innerHTML = "";

    if (querySnapshot.empty) {
      topBooksContainer.innerHTML =
        '<p class="text-center text-text-muted-light dark:text-text-muted-dark">現在、おすすめの書籍はありません。</p>';
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const book = docSnap.data();
      const bookEl = document.createElement("div");
      bookEl.className = "flex flex-col md:flex-row items-center md:items-start gap-6 rounded-lg bg-card-light dark:bg-card-dark p-6 shadow-md transition-shadow hover:shadow-xl";

      const linkHref = book.url || "#";

      // ★ 修正: 変数として定義して確実性を高める
      const targetBlank = (book.openNewTab === true) ? 'target="_blank" rel="noopener noreferrer"' : "";
      const btnText = book.buttonText || "詳細を見る";

      bookEl.innerHTML = `
        <div class="w-48 md:w-56 flex-shrink-0">
          <img alt="Book cover of ${book.title}" class="rounded-lg shadow-xl w-full h-auto object-cover aspect-[3/4]" src="${book.imageUrl}" onerror="this.src='https://placehold.co/300x400/cccccc/ffffff?text=Image+Not+Found'; this.onerror=null;">
        </div>
        <div class="flex flex-col gap-4 text-center md:text-left">
          <div class="flex flex-col gap-1">
            <p class="text-text-light dark:text-text-dark text-xl font-bold leading-tight">${book.title}</p>
            <p class="text-text-muted-light dark:text-text-muted-dark text-sm font-normal leading-normal">${book.description}</p>
          </div>
          <a class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] transition-transform hover:scale-105 mx-auto md:mx-0 w-fit" href="${linkHref}" ${targetBlank}>
            <span class="truncate">${btnText}</span>
            <span class="material-symbols-outlined ml-2 text-base">arrow_forward</span>
          </a>
        </div>
      `;
      topBooksContainer.appendChild(bookEl);
    });
  } catch (error) {
    console.error("Error loading top books: ", error);
    topBooksLoader.classList.add("hidden");
    topBooksContainer.innerHTML =
      '<p class="text-center text-red-500">おすすめ書籍の読み込みに失敗しました。</p>';
  }
}

/**
 * Firestore (staticPages/commonSettings) からプロフィールCTA設定を読み込み、profile.htmlに挿入
 */
async function loadProfileCta() {
  const ctaContainer = document.getElementById('profile-cta-container');
  if (!ctaContainer) return;

  try {
    const docRef = doc(db, "staticPages", "commonSettings");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().profileCta) {
      const ctaData = docSnap.data().profileCta;

      if (ctaData.visible === true) {
        const ctaHtml = `
          <div class="cta-block p-8 bg-blue-100 dark:bg-blue-900/50 rounded-xl text-center">
              <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">${ctaData.mainText || ''}</h3>
              <p class="text-text-muted-light dark:text-text-muted-dark mb-6">${ctaData.subText || ''}</p>
              <a href="${ctaData.buttonUrl || '#'}" role="button" class="inline-flex items-center justify-center gap-2 py-3 px-8 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                  <span class="truncate">${ctaData.buttonText || '詳細を見る'}</span>
                  <span class="material-symbols-outlined ml-1 text-base">arrow_forward</span>
              </a>
          </div>
        `;
        ctaContainer.innerHTML = ctaHtml;
      } else {
        ctaContainer.innerHTML = '';
      }
    }
  } catch (error) {
    console.error("プロフィールCTAの読み込みエラー:", error);
    ctaContainer.innerHTML = '<p class="text-sm text-red-500">CTA読込失敗</p>';
  }
}

/**
 * Firestore (contactInfo) からお問い合わせ情報を読み込み、profile.htmlに挿入
 */
async function loadPublicContactInfo() {
  const container = document.getElementById('contact-info-container');
  if (!container) return;

  container.innerHTML = '<p class="text-center text-text-muted-light dark:text-text-muted-dark">情報を読み込み中...</p>';

  try {
    const infoCol = collection(db, 'contactInfo');
    const q = query(infoCol, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = '<p class="text-text-muted-light dark:text-text-muted-dark">お問い合わせ情報はありません。</p>';
      return;
    }

    let html = '';
    querySnapshot.forEach(docSnap => {
      const item = docSnap.data();
      let iconHtml = '';
      if (item.customIconUrl) {
        iconHtml = `<img src="${item.customIconUrl}" alt="${item.title}" class="w-8 h-8 object-contain mt-1">`;
      } else {
        iconHtml = `<span class="material-symbols-outlined text-2xl text-primary mt-1">${item.icon || 'info'}</span>`;
      }
      html += `
        <div class="flex items-start gap-4 border-b border-slate-200 dark:border-slate-700 py-4">
          <div class="flex-shrink-0">${iconHtml}</div>
          <div class="flex-1">
            <p class="font-bold text-lg">${item.title || ''}</p>
            <p class="text-text-muted-light dark:text-text-muted-dark mt-1 whitespace-pre-wrap">${formatText(item.description || '')}</p>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (error) {
    console.error("お問い合わせ情報の読み込みエラー:", error);
    container.innerHTML = '<p class="text-red-500">情報の読み込み中にエラーが発生しました。</p>';
  }
}

/**
 * テキスト内のURL、電話番号、改行をHTMLタグに変換する共通関数
 * @param {string} text - 変換元のテキスト
 * @return {string} - 変換後のHTML文字列
 */
function formatText(text) {
  if (!text) return '';

  // 1. URLをリンクに変換
  let formatted = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>');

  // 2. 電話番号をリンクに変換 (簡易的な正規表現)
  formatted = formatted.replace(/(0\d{1,4}-?\d{1,4}-?\d{3,4})/g, '<a href="tel:$1" class="text-primary hover:underline">$1</a>');

  // 3. 改行を <br> に変換
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

/**
 * 有効な「お問い合わせセット」を読み込み、profile.htmlに表示する
 */
async function loadActiveContactSet() {
  const container = document.getElementById('contact-set-container');
  if (!container) return;

  try {
    // 1. 有効なセットIDを取得
    const settingsDoc = await getDoc(doc(db, "staticPages", "commonSettings"));
    if (!settingsDoc.exists() || !settingsDoc.data().activeContactSetId) {
      container.innerHTML = ''; // 有効なセットがなければ非表示
      return;
    }
    const activeSetId = settingsDoc.data().activeContactSetId;

    // 2. セットの詳細データを取得
    const setDoc = await getDoc(doc(db, "contactSets", activeSetId));
    if (!setDoc.exists()) {
      container.innerHTML = '';
      return;
    }
    const setData = setDoc.data();

    // 3. HTML生成 (Tailwind CSS)
    let html = '<div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">';

    // 3-1. CTAブロック
    if (setData.cta && setData.cta.visible) {
      const ctaAlign = setData.cta.align || 'text-center';
      html += `
        <div class="cta-block p-8 bg-blue-50 dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-slate-700 ${ctaAlign}">
            <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">${setData.cta.mainText || ''}</h3>
            <p class="text-base text-text-muted-light dark:text-text-muted-dark mb-6">${setData.cta.subText || ''}</p>
            <a href="${setData.cta.buttonUrl || '#'}" class="inline-flex items-center justify-center gap-2 py-3 px-8 bg-primary text-white font-bold rounded-lg hover:opacity-90 transition-opacity">
                <span>${setData.cta.buttonText || '詳細を見る'}</span>
                <span class="material-symbols-outlined text-base">arrow_forward</span>
            </a>
        </div>
      `;
    }

    // 3-2. アイコンリスト
    if (setData.items && setData.items.length > 0) {
      // クラスの動的生成
      const columns = setData.itemsColumns || '2';
      let gridClass = 'grid grid-cols-1 gap-6';
      if (columns === '2') gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-6';
      if (columns === '3') gridClass = 'grid grid-cols-1 md:grid-cols-3 gap-6';

      html += `<div class="${gridClass}">`;
      setData.items.forEach(item => {
        if (item.visible !== false) { // visibleがfalseでなければ表示
          // レイアウト設定の取得
          const pos = setData.itemsIconPosition || 'flex-row';
          const align = setData.itemsAlign || 'text-left';
          let layoutClass = '';

          if (pos === 'flex-col') {
            if (align === 'text-center') layoutClass = 'flex-col items-center text-center';
            else if (align === 'text-right') layoutClass = 'flex-col items-end text-right';
            else layoutClass = 'flex-col items-start text-left';
          } else { // flex-row
            if (align === 'text-center') layoutClass = 'flex-row items-center justify-center text-center';
            else if (align === 'text-right') layoutClass = 'flex-row items-center justify-end text-right';
            else layoutClass = 'flex-row items-center justify-start text-left';
          }

          let iconHtml = item.image ?
            `<img src="${item.image}" class="w-8 h-8 object-contain">` :
            `<span class="material-symbols-outlined text-3xl text-primary">${item.icon || 'info'}</span>`;

          html += `
                <div class="flex gap-6 p-8 rounded-2xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 shadow-sm ${layoutClass}">
                   <div class="flex-shrink-0">${iconHtml}</div>
                   <div>
                      <h4 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">${item.title}</h4>
                      <p class="text-base text-gray-600 dark:text-gray-400">${formatText(item.description)}</p>
                   </div>
                </div>
             `;
        }
      });
      html += `</div>`;
    }

    html += '</div>'; // ★ ラッパー終了
    container.innerHTML = html;

  } catch (error) {
    console.error("お問い合わせセットの読み込みエラー:", error);
    container.innerHTML = '<p class="text-red-500">情報の読み込みに失敗しました。</p>';
  }
}

/**
 * ページ内のカスタムHTML部品用コンテナを検出し、コンテンツをロードする
 */
async function loadCustomHtmlParts() {
  // idが "custom-part-" で始まるすべての要素を取得
  const containers = document.querySelectorAll('[id^="custom-part-"]');

  if (containers.length === 0) return;

  try {
    // 各コンテナに対して処理を実行
    for (const container of containers) {
      const partId = container.id.replace('custom-part-', '');
      if (!partId) continue;

      // Firestoreから部品データを取得
      const docRef = doc(db, "customParts", partId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // HTMLを挿入 (Tailwindのスタイルも適用される)
        container.innerHTML = data.htmlContent || '';
      } else {
        console.warn(`Custom part not found: ${partId}`);
      }
    }
  } catch (error) {
    console.error("カスタムHTML部品の読み込みエラー:", error);
  }
}

/**
 * 共通フッターを生成して表示する
 */
async function loadGlobalFooter() {
  const container = document.getElementById('global-footer-container');
  if (!container) return;

  try {
    // Firestoreから設定を取得
    const docRef = doc(db, "staticPages", "commonSettings");
    const docSnap = await getDoc(docRef);

    let footerText = "© {year} Portfolio Site. All rights reserved."; // デフォルト値

    if (docSnap.exists() && docSnap.data().footerText) {
      footerText = docSnap.data().footerText;
    }

    // {year}を現在の西暦に置換
    const year = new Date().getFullYear();
    const finalText = footerText.replace(/{year}/g, year);

    const footerHtml = `
      <footer class="w-full mt-auto py-6 border-t border-slate-200 dark:border-slate-800 bg-background-light dark:bg-background-dark">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
          <p>${finalText}</p>
        </div>
      </footer>
    `;

    container.innerHTML = footerHtml;

  } catch (error) {
    console.error("フッターの読み込みエラー:", error);
    // エラー時はデフォルト表示
    const year = new Date().getFullYear();
    container.innerHTML = `
      <footer class="w-full mt-auto py-6 border-t border-slate-200 dark:border-slate-800 bg-background-light dark:bg-background-dark">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-text-muted-light dark:text-text-muted-dark">
          <p>&copy; ${year} Portfolio Site. All rights reserved.</p>
        </div>
      </footer>
    `;
  }
}

/**
 * サイトのブランディング（タイトル・ロゴ）を読み込んでヘッダーに反映する
 */
async function loadSiteBranding() {
  const brandingEl = document.getElementById('header-branding');
  if (!brandingEl) return;

  try {
    const docRef = doc(db, "staticPages", "commonSettings");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const siteTitle = data.siteTitle || 'Portfolio Site';
      const logoUrl = data.logoUrl;

      if (logoUrl) {
        // ロゴ画像がある場合
        brandingEl.innerHTML = `<img src="${logoUrl}" alt="${siteTitle}" class="h-8 w-auto object-contain">`;
      } else {
        // ロゴ画像がない場合（デフォルト表示）
        brandingEl.innerHTML = `
          <div class="text-primary dark:text-secondary">
            <span class="material-symbols-outlined text-3xl">account_balance_wallet</span>
          </div>
          <h2 class="text-lg font-bold tracking-[-0.015em]">${siteTitle}</h2>
        `;
      }
    }
  } catch (error) {
    console.error("サイトブランディングの読み込みエラー:", error);
    // エラー時はデフォルト表示（変更なし）
  }
}
