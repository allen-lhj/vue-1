// 存储副作用函数的桶

const bucket = new Set()

// 原始数据
const data = { text: 'hello world' }

// 对原始数据的代理
const obj = new Proxy(data, {
  // 拦截读取操作
  get(target, key) {
    // 将副作用函数存入桶中
    bucket.add(effect)
    return target[key]
  },
  // 拦截设置操作
  set(target, key, newVal) {
    target[key] = newVal
    bucket.forEach(fn => fn())
    return true
  },
})

// 副作用函数
function effect() {
  document.body.innerText = obj.text
}
// 执行副作用函数，触发读取

effect()

setTimeout(() => {
  obj.text = 'hello vue3'
}, 2000)
