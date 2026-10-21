#include <iostream>
using namespace std;

int total = 0;

void printSubsequences(string s, int index, string current) {
    if (index == s.length()) {            // made a choice for every character
        cout << "\"" << current << "\"" << endl;
        total++;
        return;
    }
    printSubsequences(s, index + 1, current + s[index]);   // TAKE s[index]
    printSubsequences(s, index + 1, current);              // SKIP s[index]
}

int main() {
    string s = "abc";
    cout << "All subsequences of " << s << ":" << endl;
    printSubsequences(s, 0, "");
    cout << "Total = " << total << " (2^" << s.length() << ")" << endl;
    return 0;
}
