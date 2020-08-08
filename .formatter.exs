# Used by "mix format"
locals_without_parens = [
  query: 2
]

[
  inputs: ["{mix,.formatter}.exs", "{config,lib,test}/**/*.{ex,exs}"],
  import_deps: [:plug],
  locals_without_parens: locals_without_parens
]
