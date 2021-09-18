/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin (Vue: Class<Component>) {

  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    // 开发环境性能检测
    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // 设置一个flag，避免vm实例对象被 observed 方法转换为响应式的方法。
    // a flag to avoid this being observed
    vm._isVue = true

    // 合并 options 
    // vm.$options = Vue.options + new Vue 时传入的 options
    // merge options
    if (options && options._isComponent) {
      // 是组件的情况
      // optimize i nternal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      // 非组件的情况
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }

    // 给实例设置渲染时候的代理对象
    // 此处的代理渲染代理对象会在调用 _render.call(_renderProxy) 传入
    // 指定 render 函数的内部 this 指向
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      // 如果在开发环境 会将调用  vm._renderProxy = new Proxy(vm, handler) 转换为代理对象
      // 如果有options.render && options.render._withStripped
      // 会对 has ，get 操作进行劫持，后面在了解
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }

    // 暴露 自身实例
    // expose real self
    vm._self = vm
    // 初始化与生命周期相关的实例变量
    // $parent（将当前实例添加到 parent.$children里面）,$root, $children,$refs
    initLifecycle(vm)

    // 初始化当前组件 _events 事件中心，拿到父组件的所有监听器，通过@xxxx 注册的
    initEvents(vm)

    // RJ
    // vm 的编译render初始化     
    // $slots/$scopedSlots/_c/$createElement/$attrs/$listeners
    initRender(vm)
    callHook(vm, 'beforeCreate')

    // 把 inject 的成员注入到 vm 上
    initInjections(vm) // resolve injections before data/props

    // 初始化 vm 的 _props/methods/_data/computed/watch
    initState(vm)

    // 初始化 provide，给 vm._provide = 所定义的 provide
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      // 挂载整个页面
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
