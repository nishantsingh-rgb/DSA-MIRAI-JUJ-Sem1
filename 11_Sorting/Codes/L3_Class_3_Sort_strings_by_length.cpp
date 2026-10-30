#include <iostream>
#include <algorithm>
#include <string>
#include <vector>
using namespace std;

bool shorterFirst(const string &a, const string &b) {
    if (a.size() != b.size()) {
        return a.size() < b.size();                 // shorter word first
    }
    return a < b;                                   // same length: alphabetical
}

int main() {
    vector<string> words = {"banana", "kiwi", "apple", "fig", "cherry", "plum"};

    sort(words.begin(), words.end(), shorterFirst);
    for (const string &w : words) {
        cout << w << " (" << w.size() << ")" << endl;
    }
    return 0;
}
