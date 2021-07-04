let templatesEl = document.getElementById('templates')
let openButton = document.getElementById('open');
let saveButton = document.getElementById('save');
let input = document.querySelector('input[name="save-name"]');

async function init () {
    chrome.storage.local.get('templates', ({ templates }) => {
        console.log(templates);

        // テンプレートがなければ終了
        if (templates == null || Object.keys(templates).length === 0) {
            let p = document.createElement('p');
            p.textContent = 'テンプレートが保存されていません';
            templatesEl.innerHTML = '';
            templatesEl.appendChild(p);
            return;
        }

        // テンプレートを画面に表示
        Object.keys(templates).forEach((key) => {
            const { tabs, group } = templates[key];

            let templateEl = document.createElement('div');
            templateEl.classList.add('template');
            let radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'templates';
            radio.value = key;
            templateEl.appendChild(radio);
            let title = document.createElement('h2');
            title.textContent = key;
            templateEl.appendChild(title);

            // グループがあればそれごとのリストを作っておく
            let groupListElements = group.map((val) => {
                let groupUl = document.createElement('ul');
                groupUl.dataset.title = val.title;
                groupUl.dataset.groupId = val.id;
                groupUl.style.backgroundColor = val.color;
                groupUl.classList.add('group-list');
                return groupUl;
            });

            // URLごとにリストに追加する            
            let ul = document.createElement('ul');
            ul.style.display = "none";
            tabs.forEach((tab) => {
                if (tab.groupId > 0) {
                    // グループがあればそこに追加
                    let targetGroup = groupListElements.find((val) => val.dataset.groupId == tab.groupId);
                    if (!ul.querySelector(`[data-group-id="${tab.groupId}"]`)) {
                        // まだ追加されていないグループの場合はリストに追加
                        let li = document.createElement('li');
                        li.appendChild(targetGroup);
                        ul.appendChild(li);
                    }
                    let li = document.createElement('li');
                    li.textContent = tab.url;
                    targetGroup.appendChild(li);
                } else {
                    // グループがなければ普通に追加
                    let li = document.createElement('li');
                    li.textContent = tab.url;
                    ul.appendChild(li);
                }
            });
            templateEl.appendChild(ul);

            templatesEl.appendChild(templateEl);
        });
    });
}

/**
 * ストレージからテンプレートを呼び出してタブを開く
 */
async function open () {
    const radio = document.querySelector('input[type="radio"]:checked');
    if (radio == null) {
        alert('開きたいテンプレートを選択してください');
        return;
    }

    chrome.storage.local.get('templates', async ({ templates }) => {
        if (templates == null || templates[radio.value] == null) {
            alert('開きたいテンプレート情報が見つかりませんでした');
            return;
        }
        const { tabs, group } = templates[radio.value];
        openTabs(tabs, group);
    });
}

/**
 * 現在のタブの情報を取得して保存する
 */
async function save () {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const group = await getGroupDate(tabs);

    // テンプレート名を入力してもらって保存する
    if (input.value) {
        chrome.storage.local.get('templates', async ({ templates }) => {
            templates = templates || {};
            templates[input.value] = { tabs, group };
            await chrome.storage.local.set({ templates });
            alert('テンプレートを保存しました');
            input.value = '';
        });
    } else {
        alert('テンプレートを保存する場合には名前を入力してください');
    }
}

/**
 * タブ情報とグループ情報からタブを開く
 */
async function openTabs(tabs, group) {
    // グループの一時保存先を準備
    const groupDate = {};
    for (let g of group) {
        groupDate[g.id] = [];
    }

    // URLを開く
    for (const tab of tabs) {
        const tabDate = await chrome.tabs.create({ 
            // openerTabId: tab.id,
            url: tab.url,
            pinned: tab.pinned,
            active: false
        });

        // グループに入ってたらデータを保持しておく
        if (tab.groupId > 0) {
            groupDate[tab.groupId].push(tabDate.id);
        }
    }

    // グループがあればまとめる
    if (group == null) {
        return;
    }

    console.log(groupDate);

    for (const g of group) {
        console.log(groupDate[g.id]);
        const group = await chrome.tabs.group({ tabIds: groupDate[g.id] });
        await chrome.tabGroups.update(group, { title: g.title, color: g.color, collapsed: true })
    }
}

/**
 * タブ情報からグループ情報を取得して返す
 */
async function getGroupDate (tabs) {
    // グループ情報を取得
    const group = [];
    for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].groupId > 0) {
            const data = await chrome.tabGroups.get(tabs[i].groupId);
            group.push(data);
        }
    }

    // 重複を削除
    let tmp = [];
    return group.filter(e => {
        if (tmp.indexOf(e["id"]) === -1) {
            tmp.push(e["id"]);
            return e;
        }
    });
}

openButton.addEventListener('click', open);
saveButton.addEventListener('click', save);
init();