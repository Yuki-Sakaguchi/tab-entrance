let templatesEl = document.getElementById('templates');
let clearButton = document.getElementById('clear');

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
            let title = document.createElement('h2');
            title.classList.add('group-title');
            title.textContent = key;
            templateEl.appendChild(title);

            // グループがあればそれごとのリストを作っておく
            let groupListElements = group.map((val) => {
                let groupUl = document.createElement('ul');
                groupUl.dataset.title = val.title;
                groupUl.dataset.groupId = val.id;
                groupUl.classList.add(val.color);
                groupUl.classList.add('group-list');
                return groupUl;
            });

            // URLごとにリストに追加する            
            let ul = document.createElement('ul');
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
                    li.style = 'background-image: url(' + tab.favIconUrl + ')';
                    li.classList.add('icon');
                    li.textContent = tab.url;
                    targetGroup.appendChild(li);
                } else {
                    // グループがなければ普通に追加
                    let li = document.createElement('li');
                    li.textContent = tab.url;
                    li.style = 'background-image: url(' + tab.favIconUrl + ')';
                    li.classList.add('icon');
                    ul.appendChild(li);
                }
            });
            templateEl.appendChild(ul);

            templatesEl.appendChild(templateEl);
        });
    });
}

async function clear () {
    if (confirm('テンプレートを削除しますがよろしいでしょうか？')) {
        await chrome.storage.local.clear();
        init();
        alert('テンプレートを削除しました');
    } else {
        alert('テンプレートの削除をキャンセルしました');
    }
}

clearButton.addEventListener('click', clear);
init();