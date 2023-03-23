// 用一个全局变量存储被注册的副作用函数
let activeEffect = { deps: [] }
// effect 栈
const effectStack = []
// effect 函数用于注册副作用函数
function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn)
    // 当调用 effect 注册副作用函数时，将副作用函数 fn 赋值给 activeEffect
    activeEffect = effectFn
    // 在调用副作用函数之前，将副作用函数入栈
    effectStack.push(effectFn)
    fn()
    // 在调用副作用函数之后，将副作用函数出栈
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }
  // 将options 挂载到 effectFn 上
  effectFn.options = options
  // 为副作用函数添加一个 deps 属性，用于存储所有与该副作用函数相关的依赖集合
  effectFn.deps = []
  // 执行副作用函数
  effectFn()
}

// 存储副作用函数的桶

const bucket = new WeakMap()

// 在 get 拦截函数内调用，track 函数追踪变化
function track(target, key) {
  if (!activeEffect)
    return
  // 根据 target 从 “桶” 中取得 depsMap, 它也是一个 Map 类型： key --> effects
  let depsMap = bucket.get(target)
  // 如果不存在 depsMap, 那么新建一个 Map 并与 target 关联
  if (!depsMap)
    bucket.set(target, (depsMap = new Map()))
  // 再根据 key 从 depsMap 中取得 deps， 它是一个set类型，
  // 里面存储着所有与当前 key 相关联的副作用函数： effects
  let deps = depsMap.get(key)

  // 如果 deps 不存在，同样新建一个 Set 并与 key 关联
  if (!deps)
    depsMap.set(key, (deps = new Set()))
  // 把当前激活的副作用函数添加到依赖集合 deps 中
  deps.add(activeEffect)
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap)
    return
  const effects = depsMap.get(key)
  const effectSToRun = new Set()
  effects && effects.forEach((effectFn) => {
    // 如果 trigger 触发执行的副作用函数与当前正在执行的副作用函数相同，则不处罚执行
    if (effectFn !== activeEffect)
      effectSToRun.add(effectFn)
  })
  effectSToRun.forEach((effectFn) => {
    // 如果一个副作用函数存在调度器，则调用该调度器，并将副作用函数作为参数传递
    if (effectFn.options.scheduler)
      effectFn.options.scheduler(effectFn)
    else
      effectFn()
  })
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

// 原始数据
const data = { foo: 1 }

// 对原始数据的代理
const obj = new Proxy(data, {
  // 拦截读取操作
  get(target, key) {
    track(target, key)
    return target[key]
  },
  // 拦截设置操作
  set(target, key, newVal) {
    target[key] = newVal
    trigger(target, key)
  },
})

effect(
  () => {
    console.log(obj.foo)
  },
  // options
  // {
  //   // 调度器 scheduler function
  //   scheduler(fn) {
  //     setTimeout(fn)
  //   },
  // },
)

obj.foo++
obj.foo++
// console.log('结束了')