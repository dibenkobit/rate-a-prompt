export type EditorLanguage = 'yaml' | 'markdown';

export function detectLanguage(text: string): EditorLanguage {
    const trimmed = text.trim();
    if (!trimmed) return 'markdown';

    const lines = trimmed.split('\n');

    // YAML frontmatter delimiter at start
    if (lines[0] === '---') return 'yaml';

    // Count YAML-like lines (key: value patterns)
    let yamlScore = 0;
    for (const line of lines.slice(0, 20)) {
        const stripped = line.trim();
        if (!stripped || stripped.startsWith('#')) continue;
        // key: value (but not markdown heading "# text")
        if (/^[\w][\w\s.-]*:\s/.test(stripped)) yamlScore++;
        // list item under a key (indented "- value")
        if (/^\s+-\s/.test(line)) yamlScore++;
    }

    // If more than 40% of non-empty lines look like YAML, call it YAML
    const nonEmpty = lines.slice(0, 20).filter((l) => l.trim()).length;
    if (nonEmpty > 0 && yamlScore / nonEmpty > 0.4) return 'yaml';

    return 'markdown';
}
