# Find root-affixes of word

查找英语单词的词根词缀组合。

#### 查找规则

0. 直接返回小于等于长度为 2 的单词
1. 先获取单词原形，还原复数、比较级、过去式等单词形式
2. 再通过穷举获得所有的词根词缀组合
3. 然后去除不完整的组合，即该拼写组合 != 单词
4. 在所有符合条件的组合中，比较所有组合的长度，获取最小长度的组合，如果有多个，则记录多个最小长度组合
5. 在所有的最小长度组合中，优先获取单词根组合
6. 在剩余的组合中，取词缀和词根的长度差值最小的组合
7. 返回所有符合条件的组合

#### 问题

1. 缺少必要的词根词缀，导致部分单词查找不到组合，比如 `wolf`, `strong`
2. 不准确
  - 查找规则可能导致部分正确组合被过滤了
  - 问题1的延伸
  - 两个单词的组合词，比如 `honeyguide`
3. 多组合
  - 依然有可能返回多种词根词缀组合，比如 `agitation`

#### 改进

首先想加入词干提取（[`Snowball`](https://snowballstem.org/)），用词干提取器代替单词原型表，优点：减少大量的无效组合，减少穷举次数，降低单词原型表带来的不确定性。

缺点：不准确，比如 `wolves` -> `wolv`，应为 `wolf`, `went` -> `went`, 应为 `go`。暂时还没有使用过其他词干提取器，不知道 `NLTK` 的 `WordNet` 会不会更好一点。其次是使原词与词干失去了关联属性，不过这点可以用单词原形表补充，如果有必要的话。

然后整理最简单词表，比如 `homeworker`，即是由 `home` 和 `worker` 两个单词组成，查找词根词缀时，拆分为两个单词查找，应更为妥当。

第三，添加词根词缀表示规则。比如，`^` 表示该词根词缀只能出现在单词开头，`$` 表示只能出现在单词结尾，其他详见 [root_affix_rule.csv](root_affix_rule.csv)。

最后是对词根词缀进行打分，这是一个粗糙的想法，未经过验证，而且如何打分，也没有什么好的思路。

#### 测试

项目测试地址：[Find root-affixes🍂 of word](https://excing.github.io/find-roots-of-word/index.html)

遇到错误或可能错误的词根词缀组合，可以通过页面右下角的 **Bad root-affixes, report to GitHub** 链接发送 Issue 到 [Github issues](https://github.com/excing/find-roots-of-word/issues)

#### 资源

- 项目中使用到的词根词缀表：[Roots and affixes](roots-and-affixes.csv)
- 项目中使用到的单词其他形式表：[Word exchanges](word-exchanges.csv)

其中参考了以下开源项目的资源：

- [lnkDrop/Match-Root](https://github.com/lnkDrop/Match-Root)
- [skywind3000/ECDICT](https://github.com/skywind3000/ECDICT)

感谢！

## LICENSE

MIT License

Copyright (c) 2022 excing