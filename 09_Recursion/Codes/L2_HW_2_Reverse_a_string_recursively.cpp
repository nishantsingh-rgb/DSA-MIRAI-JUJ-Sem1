#include <iostream>
using namespace std;

// Way 1: build a new string - reverse(rest) + first character
string reverseString(string s) {
    if (s.length() <= 1) return s;
    return reverseString(s.substr(1)) + s[0];
}

// Way 2: swap the outer pair in place, then reverse the inside
void reverseInPlace(string &s, int left, int right) {
    if (left >= right) return;
    char temp = s[left];
    s[left] = s[right];
    s[right] = temp;
    reverseInPlace(s, left + 1, right - 1);
}

int main() {
    cout << "hello -> " << reverseString("hello") << endl;
    cout << "recursion -> " << reverseString("recursion") << endl;

    string word = "DSA";
    reverseInPlace(word, 0, word.length() - 1);
    cout << "DSA reversed in place -> " << word << endl;
    return 0;
}
