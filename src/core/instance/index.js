import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// Vue 构造函数
function Vue (options) {
  // 校验是否是通过 new 关键字调用 Vue
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }

  // vue 初始化操作
  this._init(options)
}

// 给 Vue 实例添加成员 ， 如：方法, 属性
// 给 Vue 添加实例方法 _init
initMixin(Vue)

// 给 Vue 原型增加了：$data,$props 属性， $set,$delete,$watch 方法
stateMixin(Vue)

// 初始化 Vue 事件机制（发布订阅）
// $on $once $off $emit
eventsMixin(Vue)

// 初始化生命周期的相关方法
lifecycleMixin(Vue)

// 混入 render 
// 该方法的作用调用用户传入的render
// $nextTick/_render
renderMixin(Vue)

export default Vue
