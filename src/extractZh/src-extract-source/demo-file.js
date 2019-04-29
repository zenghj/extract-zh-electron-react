// 提取中的测试源
import React from 'react'
const str = '世界啊8'
export default class Demo {
  state = {
    text: '你好1',
    q: "你好吗？2",
    enText: 'hello world',
    '你好吗-key中文3': '好value7'
  }
  say = () => {
    console.log("4你好吗？")
    // 很好呀-注释1
  }
  render() {
    return <div>
      <h1 data-text="5还好吗？也许吧-dom-attr">还好吗？也许吧!1</h1>
      <p>{'6你好吖-jsx-text-node'}</p>
    </div>
  }
}

// 注释2呀