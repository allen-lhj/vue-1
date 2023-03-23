// 用一个全局变量存储被注册的副作用函数

let activeEffect;
// effect 函数用于注册副作用函数
function effect (fn) {
  // 当调用 effect 注册副作用函数时，将副作用函数 fn 赋值给 activeEffect
  activeEffect = fn;
  // 执行副作用函数
  fn();
}

// 存储副作用函数的桶

const bucket = new WeakMap();

// 原始数据

const data = { text: 'hello world' };

// 对原始数据的代理

const obj = new Proxy(data, {
  // 拦截读取操作
  get(target, key) {
    // 没有 acticeEffect, 直接return
    if (!activeEffect) return target[key];
    // 根据 target 从 “桶” 中取得 depsMap, 它也是一个 Map 类型： key --> effects
    let depsMap = bucket.get(target);
    // 如果不存在 depsMap, 那么新建一个 Map 并与 target 关联
    if (!depsMap) {
      bucket.set(target, (depsMap = new Map()));
    }
    // 再根据 key 从 depsMap 中取得 deps， 它是一个set类型，
    // 里面存储着所有与当前 key 相关联的副作用函数： effects
    let deps = depsMap.get(key);
    // 如果 deps 不存在，同样新建一个 Set 并与 key 关联
    if (!deps) {
      depsMap.set(key, (deps = new Set()))
    }

  },
  // 拦截设置操作
  set(target, key, newVal) {
    target[key] = newVal;
    bucket.forEach(fn => fn())
    return true
  }
});


effect(() => {
  console.log('effect run'); // 会打印两次
  document.body.innerText = obj.text;
})

setTimeout(() => {
  // 副作用函数中并没有读取 noExist 属性的值
  obj.noExist = 'hello vue3';
}, 1000)

// 当读取属性时，无论读取的是哪个属性，其实都一样，都会把副作用函数收集到桶里
// 当设置属性时，也都会把桶里的副作用函数取出执行，
// 副作用函数与被操作的字段之间没有明确的联系