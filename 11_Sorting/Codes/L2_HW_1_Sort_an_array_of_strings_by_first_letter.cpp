#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    vector<string> words = {"mango", "apple", "melon", "banana", "avocado", "cherry", "blueberry"};
    int n = words.size();

    // insertion sort comparing only the first letter
    for (int i = 1; i < n; i++) {
        string key = words[i];
        int j = i - 1;
        while (j >= 0 && words[j][0] > key[0]) {
            words[j + 1] = words[j];
            j--;
        }
        words[j + 1] = key;
    }

    for (const string &w : words) {
        cout << w << " ";
    }
    cout << endl;
    cout << "Same first letter keep their input order (stable):" << endl;
    cout << "apple before avocado, banana before blueberry, mango before melon" << endl;
    return 0;
}
