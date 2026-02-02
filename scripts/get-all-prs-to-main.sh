#!/bin/bash
# Script to get all pull requests targeting the main branch
# Usage: ./scripts/get-all-prs-to-main.sh [state]
# state: open, closed, all (default: all)

REPO="derickporter1993/Elaro"
STATE="${1:-all}"

# Validate state parameter
if [[ ! "$STATE" =~ ^(open|closed|all)$ ]]; then
    echo "Error: Invalid state '$STATE'"
    echo "Usage: $0 [state]"
    echo "  state: open, closed, all (default: all)"
    exit 1
fi

echo "🔍 Fetching pull requests to main branch..."
echo "Repository: $REPO"
echo "State: $STATE"
echo ""

# Check if gh CLI is available
if command -v gh &> /dev/null; then
    # Use gh CLI (preferred method)
    echo "📊 Pull Requests:"
    echo "=================================="
    
    if [ "$STATE" = "all" ]; then
        # Get both open and closed PRs
        gh pr list --repo "$REPO" --base main --state open --limit 100 --json number,title,author,state,createdAt,updatedAt | \
            jq -r '.[] | "PR #\(.number) - \(.state)\n  Title: \(.title)\n  Author: \(.author.login)\n  Created: \(.createdAt)\n  Updated: \(.updatedAt)\n"'
        
        gh pr list --repo "$REPO" --base main --state closed --limit 100 --json number,title,author,state,createdAt,updatedAt | \
            jq -r '.[] | "PR #\(.number) - \(.state)\n  Title: \(.title)\n  Author: \(.author.login)\n  Created: \(.createdAt)\n  Updated: \(.updatedAt)\n"'
    else
        # Get PRs with specific state
        gh pr list --repo "$REPO" --base main --state "$STATE" --limit 100 --json number,title,author,state,createdAt,updatedAt | \
            jq -r '.[] | "PR #\(.number) - \(.state)\n  Title: \(.title)\n  Author: \(.author.login)\n  Created: \(.createdAt)\n  Updated: \(.updatedAt)\n"'
    fi
    
    # Get count
    if [ "$STATE" = "all" ]; then
        OPEN_COUNT=$(gh pr list --repo "$REPO" --base main --state open --limit 100 --json number | jq '. | length')
        CLOSED_COUNT=$(gh pr list --repo "$REPO" --base main --state closed --limit 100 --json number | jq '. | length')
        echo "=================================="
        echo "Summary:"
        echo "  Open PRs: $OPEN_COUNT"
        echo "  Closed PRs: $CLOSED_COUNT"
        echo "  Total PRs: $((OPEN_COUNT + CLOSED_COUNT))"
    else
        COUNT=$(gh pr list --repo "$REPO" --base main --state "$STATE" --limit 100 --json number | jq '. | length')
        echo "=================================="
        echo "Total $STATE PRs: $COUNT"
    fi
    
elif [ -n "$GITHUB_TOKEN" ]; then
    # Fallback to curl with GitHub API
    echo "Using GitHub API (GITHUB_TOKEN)..."
    
    if [ "$STATE" = "all" ]; then
        # Fetch both open and closed
        for current_state in open closed; do
            response=$(curl -s "https://api.github.com/repos/$REPO/pulls?state=$current_state&base=main&per_page=100" \
                -H "Authorization: token $GITHUB_TOKEN" \
                -H "Accept: application/vnd.github.v3+json")
            
            echo "$response" | python3 -c "
import sys, json
try:
    prs = json.load(sys.stdin)
    for pr in prs:
        print(f\"PR #{pr['number']} - {pr['state'].upper()}\")
        print(f\"  Title: {pr['title']}\")
        print(f\"  Author: {pr['user']['login']}\")
        print(f\"  Created: {pr['created_at']}\")
        print(f\"  Updated: {pr['updated_at']}\")
        print()
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
"
        done
    else
        response=$(curl -s "https://api.github.com/repos/$REPO/pulls?state=$STATE&base=main&per_page=100" \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json")
        
        echo "$response" | python3 -c "
import sys, json
try:
    prs = json.load(sys.stdin)
    for pr in prs:
        print(f\"PR #{pr['number']} - {pr['state'].upper()}\")
        print(f\"  Title: {pr['title']}\")
        print(f\"  Author: {pr['user']['login']}\")
        print(f\"  Created: {pr['created_at']}\")
        print(f\"  Updated: {pr['updated_at']}\")
        print()
    print('=' * 50)
    print(f'Total {sys.argv[1]} PRs: {len(prs)}')
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
" "$STATE"
    fi
else
    echo "Error: Neither 'gh' CLI nor GITHUB_TOKEN environment variable is available"
    echo ""
    echo "Please either:"
    echo "  1. Install GitHub CLI: https://cli.github.com/"
    echo "  2. Set GITHUB_TOKEN environment variable with a GitHub personal access token"
    echo "     Get a token from: https://github.com/settings/tokens"
    exit 1
fi
