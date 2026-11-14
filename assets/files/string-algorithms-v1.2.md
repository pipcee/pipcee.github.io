# 字符串算法速查 · v1.2

> 适用场景：竞赛训练 / 面试前复习 / 自己写题时快速确认边界。

## KMP

`next[i]` 表示前缀 `s[0..i]` 的最长相等真前后缀长度。

```cpp
vector<int> prefixFunction(const string &s) {
    vector<int> pi(s.size());
    for (int i = 1; i < (int)s.size(); ++i) {
        int j = pi[i - 1];
        while (j > 0 && s[i] != s[j]) j = pi[j - 1];
        if (s[i] == s[j]) ++j;
        pi[i] = j;
    }
    return pi;
}
```

检查：
- 模式串比文本串长时直接返回；
- 多组数据重新初始化；
- 需要求所有出现位置时，匹配后令 `j = pi[j - 1]`。

## Z 函数

`z[i]` 是 `s` 与 `s[i..]` 的最长公共前缀长度，约定 `z[0] = n`。

```cpp
vector<int> zFunction(const string &s) {
    int n = (int)s.size();
    vector<int> z(n);
    z[0] = n;
    for (int i = 1, l = 0, r = 0; i < n; ++i) {
        if (i <= r) z[i] = min(r - i + 1, z[i - l]);
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) ++z[i];
        if (i + z[i] - 1 > r) { l = i; r = i + z[i] - 1; }
    }
    return z;
}
```

## Manacher

统一插入分隔符可同时处理奇偶回文，`p[i]` 表示以 `i` 为中心的最大回文半径。

```cpp
vector<int> manacher(const string &s) {
    string t = "^#";
    for (char c : s) { t += c; t += '#'; }
    t += '$';
    vector<int> p(t.size());
    int center = 0, right = 0;
    for (int i = 1; i < (int)t.size() - 1; ++i) {
        if (i < right) p[i] = min(right - i, p[2 * center - i]);
        while (t[i + p[i] + 1] == t[i - p[i] - 1]) ++p[i];
        if (i + p[i] > right) { center = i; right = i + p[i]; }
    }
    return p;
}
```

## 后缀数组

倍增排序 + 基数排序，复杂度 `O(n log n)`。实现时注意：

- 末尾显式补一个小于所有字符的哨兵；
- 比较第二关键字时越界下标视为 0；
- 排名相同时不要提前退出，否则长度为 1 的后缀会出错。

## 选择建议

| 问题 | 优先算法 | 备注 |
| --- | --- | --- |
| 单模式匹配 | KMP | 线性，易写 |
| 多模式匹配 | AC 自动机 | 对 Trie 建 fail |
| 回文 | Manacher | 比哈希稳定 |
| 子串比较 | 后缀数组 / 后缀自动机 | 视题目而定 |
| 只判断相等 | 双哈希 | 注意碰撞风险 |

最后更新：2026-10-12
