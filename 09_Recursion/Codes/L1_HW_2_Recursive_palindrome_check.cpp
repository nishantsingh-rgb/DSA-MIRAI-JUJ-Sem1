#include <iostream>
using namespace std;

bool isPalindrome(string s, int left, int right) {
    if (left >= right) return true;              // 0 or 1 characters left
    if (s[left] != s[right]) return false;       // outer pair mismatch
    return isPalindrome(s, left + 1, right - 1); // check the inside
}

void check(string word) {
    bool ok = isPalindrome(word, 0, word.length() - 1);
    cout << word << (ok ? " is" : " is not") << " a palindrome" << endl;
}

int main() {
    check("racecar");
    check("level");
    check("hello");
    check("a");
    return 0;
}
