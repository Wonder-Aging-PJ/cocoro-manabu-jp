// project-config.js
// =================================================================
// プロジェクト設定ファイル
// HTMLと同じ場所に置いてあります。
// =================================================================

// 1. Firebase接続情報
export const firebaseConfig = {
    apiKey: "AIzaSyBVX12Fc_ZYhuBMQZKMNeeBOy1x1KaBgsw",
    authDomain: "wonder-aging-cocoro-manabu.firebaseapp.com",
    projectId: "wonder-aging-cocoro-manabu",
    storageBucket: "wonder-aging-cocoro-manabu.firebasestorage.app",
    messagingSenderId: "433128332628",
    appId: "1:433128332628:web:2ccb1ff1aa9fd0c3a37cc1",
    measurementId: "G-810EGB92G0"
};

// 2. データベース（Firestore）のコレクション名
// 今後名前を変えるときはここだけ変更します
export const dbCollections = {
    USERS: 'users',             // ユーザー情報
    PAGES: 'portfolio_pages',   // ページデータ
    COMPONENTS: 'page_blocks'   // ブロックデータ
};

// 3. システム設定
export const appSettings = {
    APP_NAME: "Wonder Aging Portfolio",
    DEFAULT_LANG: "ja"
};