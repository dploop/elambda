#  An Online Lambda Interpreter


```Scheme
((\f.(\u.(u u) \x.(f \v.((x x) v)))
\factorial.\n.(
    ((cond ((less n) 2)) \_.1)
    \_.((mul (factorial ((sub n) 1))) n)
)) 9)

```


