// Ordinary TeX comments: metadata must not change the paired passage marker format.
export const modelTaggingInstructions = `## Required: record the model behind each agent passage
Immediately after each begin marker, add an ordinary TeX comment containing JSON:

\`\`\`tex
% agentlatex:author {"model":"unknown","version":"unknown","reasoning":"unknown"}
\`\`\`

Replace each value with what your session actually exposes. Use the exact model ID
or displayed name, including aliases such as Sol, Astra, Luna, Terra, Haiku, Sonnet,
Opus or Fable when that is all you know. Record a version/release identifier when
known. Reasoning is the actual setting (for example low, medium, high or xhigh),
not a model name. Use "not-applicable" only when reasoning does not apply; otherwise
use "unknown" for unavailable fields. Never guess an underlying model or version.

Keep begin/end marker syntax unchanged. Preserve existing author records when editing
a passage; append your own record if its model/version/reasoning differs. Do not
attribute untouched or imported passages to the importing agent: retain the original
model when known and use unknown otherwise. Tag newly reconstructed writing with the
model that reconstructed it. These are self-reported labels, not verified identities.
`;
