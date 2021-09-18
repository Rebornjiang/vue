/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 1. 调用 parse 函数将 template 转换为 AST 抽象语法树
  const ast = parse(template.trim(), options)
  if (options.optimize !== false) {
    // 2. 调用 optimize 优化抽象语法树
    optimize(ast, options)
  }

  // 3. 调用 generate 将抽象语法树转换为字符串 js代码
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
